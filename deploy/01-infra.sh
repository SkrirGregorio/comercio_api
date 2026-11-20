#!/usr/bin/env bash
# Paso 1: infraestructura base. Idempotente: se puede volver a ejecutar sin romper nada.
#  - APIs, Artifact Registry, cuenta de servicio de la API
#  - Secretos (JWT y contraseñas de BD) en Secret Manager
#  - Cloud SQL (PostgreSQL 16) con la base y el usuario dueño del esquema
#  - Buckets de Cloud Storage: frontend (web) e imágenes subidas (uploads)
#  - IP pública estática del balanceador
source "$(dirname "$0")/lib.sh"

step "Proyecto $PROJECT_ID · región $REGION"

step "Habilitando APIs"
gc services enable \
  run.googleapis.com sqladmin.googleapis.com artifactregistry.googleapis.com \
  cloudbuild.googleapis.com secretmanager.googleapis.com compute.googleapis.com \
  storage.googleapis.com iam.googleapis.com

step "Artifact Registry ($AR_REPO)"
exists artifacts repositories describe "$AR_REPO" --location="$REGION" ||
  gc artifacts repositories create "$AR_REPO" --repository-format=docker \
    --location="$REGION" --description="Imágenes de Comercio Local"

# En proyectos nuevos Cloud Build usa la cuenta de servicio predeterminada de Compute Engine
step "Permisos de Cloud Build"
PROJECT_NUMBER="$(gc projects describe "$PROJECT_ID" --format='value(projectNumber)')"
gc projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role=roles/cloudbuild.builds.builder --condition=None >/dev/null

step "Cuenta de servicio de la API ($SA_EMAIL)"
exists iam service-accounts describe "$SA_EMAIL" ||
  gc iam service-accounts create "$SERVICE_ACCOUNT_NAME" --display-name="Comercio Local API"
gc projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$SA_EMAIL" --role=roles/cloudsql.client --condition=None >/dev/null

step "Secretos"
for s in "$SECRET_JWT" "$SECRET_DB_OWNER" "$SECRET_DB_APP"; do
  ensure_secret "$s"
  gc secrets add-iam-policy-binding "$s" --member="serviceAccount:$SA_EMAIL" \
    --role=roles/secretmanager.secretAccessor >/dev/null
done

step "Cloud SQL ($SQL_INSTANCE, $SQL_TIER)"
if exists sql instances describe "$SQL_INSTANCE"; then
  info "La instancia ya existe"
else
  info "Creando instancia (tarda ~10 minutos)..."
  # Sin redes autorizadas: solo se accede por el conector de Cloud SQL (IAM + TLS)
  gc sql instances create "$SQL_INSTANCE" \
    --database-version=POSTGRES_16 --edition=enterprise --tier="$SQL_TIER" \
    --region="$REGION" --availability-type=zonal \
    --storage-type=SSD --storage-size=10 --storage-auto-increase \
    --backup-start-time=09:00 --retained-backups-count=7 \
    --deletion-protection
fi

exists sql databases describe "$DB_NAME" --instance="$SQL_INSTANCE" ||
  gc sql databases create "$DB_NAME" --instance="$SQL_INSTANCE"

# El usuario dueño corre las migraciones; el rol de la app (solo DML) lo crea el job de setup
OWNER_PASS="$(secret_value "$SECRET_DB_OWNER")"
if gc sql users list --instance="$SQL_INSTANCE" --format='value(name)' | grep -qx "$DB_OWNER_USER"; then
  gc sql users set-password "$DB_OWNER_USER" --instance="$SQL_INSTANCE" --password="$OWNER_PASS"
else
  gc sql users create "$DB_OWNER_USER" --instance="$SQL_INSTANCE" --password="$OWNER_PASS"
fi
unset OWNER_PASS

step "Buckets de Cloud Storage"
for b in "$WEB_BUCKET" "$UPLOADS_BUCKET"; do
  exists storage buckets describe "gs://$b" ||
    gc storage buckets create "gs://$b" --location="$REGION" --uniform-bucket-level-access
  # Lectura pública: el frontend y las imágenes son contenido público por diseño
  gc storage buckets add-iam-policy-binding "gs://$b" \
    --member=allUsers --role=roles/storage.objectViewer >/dev/null
done
# SPA: cualquier ruta desconocida (/empresas/3, /dashboard...) devuelve index.html
gc storage buckets update "gs://$WEB_BUCKET" \
  --web-main-page-suffix=index.html --web-error-page=index.html
# La API escribe y borra imágenes solo en su bucket
gc storage buckets add-iam-policy-binding "gs://$UPLOADS_BUCKET" \
  --member="serviceAccount:$SA_EMAIL" --role=roles/storage.objectAdmin >/dev/null

step "IP estática del balanceador ($LB_IP_NAME)"
exists compute addresses describe "$LB_IP_NAME" --global ||
  gc compute addresses create "$LB_IP_NAME" --global --ip-version=IPV4
info "IP: $(lb_ip)  ·  dominio: $(public_domain)"

step "Infraestructura lista. Siguiente: ./deploy/02-api.sh"
