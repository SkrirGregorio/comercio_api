#!/usr/bin/env bash
# Paso 2: construye la imagen de la API, prepara la base de datos y despliega en Cloud Run.
# Se ejecuta en cada nueva versión de la API.
#  1. Cloud Build construye la imagen (Dockerfile) y la sube a Artifact Registry
#  2. Job "db-setup": migraciones + rol de la app con privilegios mínimos
#  3. Servicio Cloud Run, accesible solo a través del balanceador
source "$(dirname "$0")/lib.sh"

TAG="$(git -C "$API_DIR" rev-parse --short HEAD 2>/dev/null || echo manual)-$(date +%Y%m%d%H%M%S)"
IMAGE="${IMAGE_BASE}:${TAG}"
PUBLIC_DOMAIN="$(public_domain)"
DB_HOST="/cloudsql/${SQL_CONNECTION}"

if [[ -n "$(git -C "$API_DIR" status --porcelain 2>/dev/null)" ]]; then
  info "Aviso: hay cambios sin commit; se despliega el código tal como está en disco."
fi

step "Construyendo imagen $IMAGE"
gc builds submit "$API_DIR" --region="$REGION" --tag="$IMAGE"

step "Job de base de datos (migraciones + rol $DB_APP_USER)"
gc run jobs deploy "${API_SERVICE}-db-setup" \
  --region="$REGION" --image="$IMAGE" --service-account="$SA_EMAIL" \
  --set-cloudsql-instances="$SQL_CONNECTION" \
  --command=node --args=dist/database/setup.js \
  --set-env-vars="NODE_ENV=production,DB_HOST=${DB_HOST},DB_PORT=5432,DB_NAME=${DB_NAME},DB_USER=${DB_OWNER_USER},APP_DB_USER=${DB_APP_USER}" \
  --set-secrets="DB_PASS=${SECRET_DB_OWNER}:latest,APP_DB_PASS=${SECRET_DB_APP}:latest" \
  --max-retries=0 --task-timeout=10m
gc run jobs execute "${API_SERVICE}-db-setup" --region="$REGION" --wait

step "Servicio Cloud Run ($API_SERVICE)"
# TRUST_PROXY_HOPS=2: balanceador + Cloud Run. El ingress restringido impide saltarse el
# balanceador (y falsificar X-Forwarded-For para evadir el rate limit).
gc run deploy "$API_SERVICE" \
  --region="$REGION" --image="$IMAGE" --service-account="$SA_EMAIL" \
  --add-cloudsql-instances="$SQL_CONNECTION" \
  --set-env-vars="NODE_ENV=production,DB_HOST=${DB_HOST},DB_PORT=5432,DB_NAME=${DB_NAME},DB_USER=${DB_APP_USER},DB_SYNC=false,GCS_BUCKET=${UPLOADS_BUCKET},TRUST_PROXY_HOPS=2,CORS_ORIGINS=https://${PUBLIC_DOMAIN:-localhost}" \
  --set-secrets="DB_PASS=${SECRET_DB_APP}:latest,JWT_SECRET=${SECRET_JWT}:latest" \
  --ingress=internal-and-cloud-load-balancing --allow-unauthenticated \
  --cpu=1 --memory=512Mi --min-instances=0 --max-instances=3 --concurrency=80 \
  --cpu-boost

step "API desplegada ($TAG)"
info "Pública en: https://${PUBLIC_DOMAIN:-<dominio>}/api  (requiere ./deploy/03-load-balancer.sh)"
