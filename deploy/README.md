# Despliegue en Google Cloud

Arquitectura descrita en la tesis (sección 3.8): **Cloud Run** para la API NestJS,
**Cloud Storage** para la PWA y las imágenes, y **Cloud SQL** para PostgreSQL, todo bajo HTTPS.

```
                        https://<dominio>
                               │
                 Balanceador HTTPS externo (IP fija, certificado administrado)
                 ├── /api/*  ──► Cloud Run: comercio-api ──► Cloud SQL (PostgreSQL 16)
                 │               (se quita el prefijo /api)    └─ usuario comercio_app (solo DML)
                 └── /*      ──► Cloud Storage: <proyecto>-web  (+ Cloud CDN)

   Imágenes subidas ──► Cloud Storage: <proyecto>-uploads (lectura pública)
   Secretos (JWT, contraseñas de BD) ──► Secret Manager
```

- La PWA y la API comparten dominio: el frontend usa `apiBaseUrl: '/api'`, sin URLs fijas ni problemas de CORS.
- La API solo acepta tráfico del balanceador (`ingress=internal-and-cloud-load-balancing`).
- Principio de menor privilegio en PostgreSQL: las migraciones corren con `comercio_owner`;
  la API usa `comercio_app`, que solo puede hacer SELECT/INSERT/UPDATE/DELETE (no ALTER ni DROP).
- Sin dominio propio todavía, se usa `<IP-con-guiones>.sslip.io`, que resuelve a la IP del balanceador.

## Requisitos

1. Proyecto de GCP con facturación activa (el mismo de la API key de Google Maps sirve).
2. [Google Cloud CLI](https://cloud.google.com/sdk/docs/install) (`gcloud`) y sesión iniciada:
   ```bash
   gcloud auth login
   gcloud config set project <PROJECT_ID>
   ```
3. Node 24 (`nvm use`) para compilar el frontend.

## Primer despliegue

Desde `comercio_api/`:

```bash
./deploy/01-infra.sh            # APIs, Cloud SQL, buckets, secretos, IP (~10-15 min la 1.ª vez)
./deploy/02-api.sh              # imagen + migraciones + Cloud Run
./deploy/03-load-balancer.sh    # HTTPS, CDN y enrutamiento /api
./deploy/04-seed.sh             # opcional: empresas y usuarios de demostración
```

Desde `comercio_app/`:

```bash
./deploy/deploy-web.sh          # compila la PWA y la sube al bucket
```

El certificado SSL tarda entre 15 y 60 minutos en pasar a `ACTIVE`; hasta entonces el navegador
mostrará error de conexión en `https://`. El script 03 imprime el comando para consultar su estado.

Todos los scripts son **idempotentes**: si uno falla a medias, corrige la causa y vuelve a ejecutarlo.

## Actualizaciones

| Cambió…                           | Ejecutar                          |
|-----------------------------------|-----------------------------------|
| Código de la API                  | `comercio_api/deploy/02-api.sh`   |
| Entidades (tablas)                | generar migración (abajo) y `02-api.sh` |
| Frontend                          | `comercio_app/deploy/deploy-web.sh` |
| Dominio                           | `DOMAIN=midominio.com ./deploy/03-load-balancer.sh` y luego `02-api.sh` |

### Migraciones

En producción `DB_SYNC=false`: el esquema solo cambia con migraciones versionadas.
Con la BD local (docker-compose) al día con la rama anterior:

```bash
npm run migration:generate -- src/database/migrations/NombreDelCambio
```

Revisa el archivo generado, haz commit y despliega con `02-api.sh` (el job `comercio-api-db-setup`
aplica las migraciones pendientes antes de actualizar el servicio).

## Configuración manual pendiente (consola de GCP)

1. **Restringir la API key de Maps** (APIs y servicios → Credenciales): referentes HTTP
   `https://<dominio>/*` y `http://localhost:4200/*`; APIs: Maps JavaScript API y Places API (New).
2. **Map ID** (Google Maps Platform → Administración de mapas → Crear ID de mapa, tipo JavaScript, vectorial):
   reemplazar `DEMO_MAP_ID` en `comercio_app/src/environments/environment.ts` y volver a publicar el frontend.
3. **Correo de contacto** de las páginas legales: `comercio_app/src/app/core/config/legal.config.ts` (`correoContacto`).
4. **Dominio propio** (cuando se compre): registro DNS `A` → IP del balanceador
   (`gcloud compute addresses describe comercio-ip --global --format='value(address)'`) y ejecutar
   `DOMAIN=<dominio> ./deploy/03-load-balancer.sh` y `./deploy/02-api.sh`. Para fijarlo, edita `DOMAIN` en `config.env`.

## Costos aproximados (us-central1)

| Servicio | Configuración | Aprox. USD/mes |
|---|---|---|
| Cloud SQL | db-f1-micro, 10 GB SSD, backups 7 días | 10–12 |
| Balanceador HTTPS | 2 reglas de reenvío (80 y 443) | ~18 |
| Cloud Run | 0 instancias mínimas, máx. 3 | 0 (capa gratuita) |
| Cloud Storage + CDN, Secret Manager, Artifact Registry | | < 1 |
| **Total** | | **~30** |

Los créditos de prueba de GCP (US$300) cubren varios meses, pero **vencen a los 90 días**.
Verifica con la [calculadora de precios](https://cloud.google.com/products/calculator) y crea
una alerta de presupuesto en Facturación → Presupuestos y alertas.

## Operación

```bash
# Logs de la API
gcloud run services logs read comercio-api --region=us-central1 --limit=50
# Logs del último job de BD
gcloud run jobs executions list --job=comercio-api-db-setup --region=us-central1
# Contraseña de las cuentas demo (si se ejecutó 04-seed.sh)
gcloud secrets versions access latest --secret=comercio-seed-pass
```

Respaldos: Cloud SQL hace un backup diario automático (se conservan 7).

## Problemas frecuentes

- **`allUsers` rechazado al dar lectura pública a los buckets**: la organización tiene activa la
  política *Domain restricted sharing* o *Public access prevention*; hay que desactivarla para este proyecto.
- **Cloud Build sin permisos**: `01-infra.sh` concede `roles/cloudbuild.builds.builder` a la cuenta de
  Compute Engine; si aún falla, revisa los permisos de esa cuenta en IAM.
- **Certificado en `FAILED_NOT_VISIBLE`**: el dominio no resuelve a la IP del balanceador (revisa el DNS).
- **La app muestra la versión anterior**: el service worker actualiza en la siguiente visita; recarga dos veces.

## Eliminar todo

Borra el proyecto completo (lo más simple y sin cargos residuales):

```bash
gcloud projects delete <PROJECT_ID>
```

O recurso por recurso: reglas de reenvío, proxies, url-maps, backends, NEG, certificados, IP,
servicio y jobs de Cloud Run, instancia de Cloud SQL (`--deletion-protection` se quita primero con
`gcloud sql instances patch comercio-db --no-deletion-protection`), buckets y secretos.
