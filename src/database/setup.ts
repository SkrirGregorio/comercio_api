/**
 * Prepara la base de datos de producción. Se ejecuta como Cloud Run Job con el
 * usuario dueño del esquema (DB_USER/DB_PASS):
 *
 *  1. Aplica las migraciones pendientes.
 *  2. Crea o actualiza el rol de la aplicación (APP_DB_USER/APP_DB_PASS) con
 *     privilegios mínimos: solo SELECT/INSERT/UPDATE/DELETE, sin poder alterar
 *     ni eliminar tablas (principio de menor privilegio).
 *
 * Es idempotente: se puede ejecutar en cada despliegue.
 *   node dist/database/setup.js
 */
import dataSource from './data-source';

const ROLE_NAME = /^[a-z_][a-z0-9_]{0,62}$/;

async function main() {
  await dataSource.initialize();
  try {
    const applied = await dataSource.runMigrations({ transaction: 'each' });
    console.log(
      applied.length
        ? `Migraciones aplicadas: ${applied.map((m) => m.name).join(', ')}`
        : 'Sin migraciones pendientes.',
    );

    const appUser = process.env.APP_DB_USER;
    const appPass = process.env.APP_DB_PASS;
    if (!appUser || !appPass) {
      console.log(
        'APP_DB_USER/APP_DB_PASS no definidos: se omite el rol de la app.',
      );
      return;
    }
    if (!ROLE_NAME.test(appUser)) {
      throw new Error(`APP_DB_USER inválido: ${appUser}`);
    }

    // format(%I, %L) escapa identificadores y literales en el propio servidor
    const sql = async (template: string, ...args: string[]) => {
      const params = args.map((_, i) => `$${i + 2}::text`).join(', ');
      const [{ stmt }] = await dataSource.query<{ stmt: string }[]>(
        `SELECT format($1, ${params}) AS stmt`,
        [template, ...args],
      );
      await dataSource.query(stmt);
    };

    const exists = await dataSource.query<unknown[]>(
      'SELECT 1 FROM pg_roles WHERE rolname = $1',
      [appUser],
    );
    await sql(
      exists.length
        ? 'ALTER ROLE %I WITH LOGIN PASSWORD %L'
        : 'CREATE ROLE %I WITH LOGIN PASSWORD %L NOSUPERUSER NOCREATEDB NOCREATEROLE',
      appUser,
      appPass,
    );

    const [{ db }] = await dataSource.query<{ db: string }[]>(
      'SELECT current_database() AS db',
    );
    await sql('GRANT CONNECT ON DATABASE %I TO %I', db, appUser);
    await sql('GRANT USAGE ON SCHEMA public TO %I', appUser);
    await sql(
      'GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO %I',
      appUser,
    );
    await sql(
      'GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO %I',
      appUser,
    );
    // Tablas y secuencias que creen migraciones futuras (las crea este mismo usuario)
    await sql(
      'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO %I',
      appUser,
    );
    await sql(
      'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO %I',
      appUser,
    );
    // La tabla de control de migraciones no es asunto de la app
    await sql('REVOKE ALL ON TABLE typeorm_migrations FROM %I', appUser);
    console.log(`Rol "${appUser}" listo con privilegios de solo datos (DML).`);
  } finally {
    await dataSource.destroy();
  }
}

main().catch((err) => {
  console.error('Error preparando la base de datos:', err);
  process.exit(1);
});
