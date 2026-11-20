#!/usr/bin/env bash
# Paso 3: balanceador de carga HTTPS externo (una sola vez, o al cambiar de dominio).
#   https://<dominio>/        -> bucket del frontend (Cloud Storage + Cloud CDN)
#   https://<dominio>/api/... -> API en Cloud Run (se quita el prefijo /api)
#   http://<dominio>/...      -> redirección 301 a HTTPS
# Certificado SSL administrado por Google (se renueva solo).
source "$(dirname "$0")/lib.sh"

PUBLIC_DOMAIN="$(public_domain)"
[[ -n "$PUBLIC_DOMAIN" ]] || { echo "No hay IP reservada: ejecuta primero ./deploy/01-infra.sh"; exit 1; }
LB_IP="$(lb_ip)"
CERT_NAME="comercio-cert-$(echo "$PUBLIC_DOMAIN" | tr '.' '-' | cut -c1-48)"
COMPUTE="https://www.googleapis.com/compute/v1/projects/${PROJECT_ID}"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

step "Dominio $PUBLIC_DOMAIN -> $LB_IP"

step "Backend de la API (NEG serverless -> Cloud Run)"
exists compute network-endpoint-groups describe comercio-api-neg --region="$REGION" ||
  gc compute network-endpoint-groups create comercio-api-neg --region="$REGION" \
    --network-endpoint-type=serverless --cloud-run-service="$API_SERVICE"
if ! exists compute backend-services describe comercio-api-backend --global; then
  gc compute backend-services create comercio-api-backend --global \
    --load-balancing-scheme=EXTERNAL_MANAGED
  gc compute backend-services add-backend comercio-api-backend --global \
    --network-endpoint-group=comercio-api-neg --network-endpoint-group-region="$REGION"
fi

step "Backend del frontend (bucket $WEB_BUCKET con Cloud CDN)"
exists compute backend-buckets describe comercio-web-backend ||
  gc compute backend-buckets create comercio-web-backend \
    --gcs-bucket-name="$WEB_BUCKET" --enable-cdn --cache-mode=USE_ORIGIN_HEADERS
# Cabeceras de seguridad para la PWA (la API ya las envía con helmet)
gc compute backend-buckets update comercio-web-backend \
  --custom-response-header='Strict-Transport-Security: max-age=31536000; includeSubDomains' \
  --custom-response-header='X-Content-Type-Options: nosniff' \
  --custom-response-header='X-Frame-Options: DENY' \
  --custom-response-header='Referrer-Policy: strict-origin-when-cross-origin' \
  --custom-response-header='Permissions-Policy: camera=(), microphone=(), geolocation=(self)'

step "Mapa de URLs ($URL_MAP)"
cat >"$TMP/url-map.yaml" <<YAML
name: ${URL_MAP}
defaultService: ${COMPUTE}/global/backendBuckets/comercio-web-backend
hostRules:
- hosts: ['*']
  pathMatcher: main
pathMatchers:
- name: main
  defaultService: ${COMPUTE}/global/backendBuckets/comercio-web-backend
  routeRules:
  - priority: 1
    matchRules:
    - prefixMatch: /api/
    service: ${COMPUTE}/global/backendServices/comercio-api-backend
    routeAction:
      urlRewrite:
        pathPrefixRewrite: /
YAML
gc compute url-maps import "$URL_MAP" --global --source="$TMP/url-map.yaml"

step "Certificado SSL administrado ($CERT_NAME)"
exists compute ssl-certificates describe "$CERT_NAME" --global ||
  gc compute ssl-certificates create "$CERT_NAME" --domains="$PUBLIC_DOMAIN" --global

step "Proxy y regla HTTPS (443)"
if exists compute target-https-proxies describe comercio-https-proxy --global; then
  gc compute target-https-proxies update comercio-https-proxy --global \
    --ssl-certificates="$CERT_NAME" --url-map="$URL_MAP"
else
  gc compute target-https-proxies create comercio-https-proxy --global \
    --ssl-certificates="$CERT_NAME" --url-map="$URL_MAP"
fi
exists compute forwarding-rules describe comercio-https-rule --global ||
  gc compute forwarding-rules create comercio-https-rule --global \
    --load-balancing-scheme=EXTERNAL_MANAGED --address="$LB_IP_NAME" \
    --target-https-proxy=comercio-https-proxy --ports=443

step "Redirección HTTP -> HTTPS (80)"
cat >"$TMP/http-redirect.yaml" <<YAML
name: comercio-http-redirect
defaultUrlRedirect:
  redirectResponseCode: MOVED_PERMANENTLY_DEFAULT
  httpsRedirect: true
YAML
gc compute url-maps import comercio-http-redirect --global --source="$TMP/http-redirect.yaml"
exists compute target-http-proxies describe comercio-http-proxy --global ||
  gc compute target-http-proxies create comercio-http-proxy --global --url-map=comercio-http-redirect
exists compute forwarding-rules describe comercio-http-rule --global ||
  gc compute forwarding-rules create comercio-http-rule --global \
    --load-balancing-scheme=EXTERNAL_MANAGED --address="$LB_IP_NAME" \
    --target-http-proxy=comercio-http-proxy --ports=80

STATUS="$(gc compute ssl-certificates describe "$CERT_NAME" --global --format='value(managed.status)')"
step "Balanceador listo"
info "URL: https://$PUBLIC_DOMAIN"
info "Certificado: $STATUS (PROVISIONING puede tardar 15-60 min; ACTIVE = listo)"
if [[ -n "$DOMAIN" ]]; then
  info "DNS: crea un registro A  $DOMAIN -> $LB_IP  (el certificado no se emite sin él)"
fi
info "Ver estado: gcloud compute ssl-certificates describe $CERT_NAME --global --format='value(managed.status,managed.domainStatus)'"
