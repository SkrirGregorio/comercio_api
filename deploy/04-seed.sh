#!/usr/bin/env bash
# Paso opcional: carga los datos de prueba (empresas, servicios, usuarios demo) en Cloud SQL.
# Las cuentas demo NO usan la contraseña por defecto del repositorio: se genera una
# aleatoria en Secret Manager. Para verla:
#   gcloud secrets versions access latest --secret=comercio-seed-pass
source "$(dirname "$0")/lib.sh"

IMAGE="$(gc run services describe "$API_SERVICE" --region="$REGION" \
  --format='value(spec.template.spec.containers[0].image)')"
[[ -n "$IMAGE" ]] || { echo "Despliega primero la API: ./deploy/02-api.sh"; exit 1; }

step "Secreto de las cuentas demo"
ensure_secret "$SECRET_SEED"
gc secrets add-iam-policy-binding "$SECRET_SEED" --member="serviceAccount:$SA_EMAIL" \
  --role=roles/secretmanager.secretAccessor >/dev/null

step "Job de seed (usuario $DB_APP_USER, solo DML)"
gc run jobs deploy "${API_SERVICE}-seed" \
  --region="$REGION" --image="$IMAGE" --service-account="$SA_EMAIL" \
  --set-cloudsql-instances="$SQL_CONNECTION" \
  --command=node --args=dist/seed/seed.js \
  --set-env-vars="NODE_ENV=production,SEED_FORCE=true,DB_HOST=/cloudsql/${SQL_CONNECTION},DB_PORT=5432,DB_NAME=${DB_NAME},DB_USER=${DB_APP_USER},DB_SYNC=false,GCS_BUCKET=${UPLOADS_BUCKET}" \
  --set-secrets="DB_PASS=${SECRET_DB_APP}:latest,JWT_SECRET=${SECRET_JWT}:latest,SEED_PASSWORD=${SECRET_SEED}:latest" \
  --max-retries=0 --task-timeout=10m
gc run jobs execute "${API_SERVICE}-seed" --region="$REGION" --wait

step "Datos de prueba cargados"
info "Contraseña de las cuentas demo: gcloud secrets versions access latest --secret=$SECRET_SEED"
