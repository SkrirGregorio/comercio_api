# Funciones comunes de los scripts de despliegue. Se carga con: source "$(dirname "$0")/lib.sh"
set -euo pipefail

DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_DIR="$(dirname "$DEPLOY_DIR")"

command -v gcloud >/dev/null || { echo "Falta gcloud (Google Cloud CLI)."; exit 1; }

# shellcheck source=config.env
source "$DEPLOY_DIR/config.env"

if [[ -z "$PROJECT_ID" ]]; then
  echo "Define el proyecto: gcloud config set project <PROJECT_ID>  (o PROJECT_ID=... al ejecutar)"
  exit 1
fi

SA_EMAIL="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
SQL_CONNECTION="${PROJECT_ID}:${REGION}:${SQL_INSTANCE}"
IMAGE_BASE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${AR_REPO}/api"

gc() { gcloud --project="$PROJECT_ID" --quiet "$@"; }

step() { printf '\n\033[1;34m==> %s\033[0m\n' "$*"; }
info() { printf '    %s\n' "$*"; }

# exists <comando describe...>: true si el recurso ya existe
exists() { gc "$@" >/dev/null 2>&1; }

# IP pública reservada para el balanceador (vacío si aún no existe)
lb_ip() {
  gc compute addresses describe "$LB_IP_NAME" --global --format='value(address)' 2>/dev/null || true
}

# Dominio público: el configurado o, si no hay, <IP>.sslip.io
public_domain() {
  if [[ -n "$DOMAIN" ]]; then
    echo "$DOMAIN"
  else
    local ip
    ip="$(lb_ip)"
    [[ -n "$ip" ]] && echo "${ip//./-}.sslip.io"
  fi
}

# Crea el secreto con un valor aleatorio si no existe (nunca lo sobrescribe)
ensure_secret() {
  local name="$1"
  if exists secrets describe "$name"; then
    info "Secreto $name ya existe"
  else
    openssl rand -hex 32 | tr -d '\n' | gc secrets create "$name" --replication-policy=automatic --data-file=-
    info "Secreto $name creado"
  fi
}

secret_value() { gc secrets versions access latest --secret="$1"; }
