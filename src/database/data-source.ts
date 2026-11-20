import 'reflect-metadata';
import { join } from 'path';
import { DataSource, DataSourceOptions } from 'typeorm';

/**
 * Conexión usada por la CLI de TypeORM (migraciones) y por el job de setup.
 * La API en ejecución usa la configuración de AppModule.
 */
export function dataSourceOptions(): DataSourceOptions {
  return {
    type: 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 5432),
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
    migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
    migrationsTableName: 'typeorm_migrations',
  };
}

// En local, cargar .env si existe (en Cloud Run las variables ya vienen del entorno)
try {
  process.loadEnvFile();
} catch {
  /* sin .env */
}

export default new DataSource(dataSourceOptions());
