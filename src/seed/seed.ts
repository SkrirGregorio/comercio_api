/**
 * Carga datos de prueba (usuarios, empresas, servicios, posts y reseñas).
 * Es idempotente: se puede ejecutar varias veces sin duplicar registros.
 *
 *   npm run seed
 *
 * Variables opcionales:
 *   SEED_PASSWORD  contraseña para todas las cuentas de prueba
 *   SEED_FORCE     "true" para permitir ejecutarlo con NODE_ENV=production
 */
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../app.module';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { Empresa } from '../empresas/entities/empresa.entity';
import { Servicio } from '../servicios/entities/servicio.entity';
import { Post } from '../posts/entities/post.entity';
import { Resena } from '../resenas/entities/resena.entity';
import {
  DEFAULT_SEED_PASSWORD,
  EMPRESAS,
  RESENAS,
  SERVICIOS,
  USUARIOS,
} from './seed-data';

const logger = {
  log: (msg: string) => console.log(`[Seed] ${msg}`),
  error: (msg: unknown) => console.error('[Seed]', msg),
};

async function run() {
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.SEED_FORCE !== 'true'
  ) {
    throw new Error(
      'Seed bloqueado en producción. Usa SEED_FORCE=true si es intencional.',
    );
  }

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  const ds = app.get(DataSource);

  try {
    await ds.transaction(async (em) => {
      const usuarios = em.getRepository(Usuario);
      const empresas = em.getRepository(Empresa);
      const servicios = em.getRepository(Servicio);
      const posts = em.getRepository(Post);
      const resenas = em.getRepository(Resena);

      // Usuarios
      const hash = await bcrypt.hash(
        process.env.SEED_PASSWORD || DEFAULT_SEED_PASSWORD,
        10,
      );
      const usuarioPorEmail = new Map<string, Usuario>();
      for (const u of USUARIOS) {
        let usuario = await usuarios.findOne({ where: { email: u.email } });
        usuario = usuarios.merge(usuario ?? usuarios.create(), {
          ...u,
          password: hash,
          isActive: true,
        });
        usuarioPorEmail.set(u.email, await usuarios.save(usuario));
      }
      logger.log(`Usuarios: ${USUARIOS.length}`);

      // Catálogo de servicios
      const servicioPorNombre = new Map<string, Servicio>();
      for (const s of SERVICIOS) {
        let servicio = await servicios.findOne({ where: { nombre: s.nombre } });
        servicio = servicios.merge(servicio ?? servicios.create(), s);
        servicioPorNombre.set(s.nombre, await servicios.save(servicio));
      }
      logger.log(`Servicios: ${SERVICIOS.length}`);

      // Empresas con sus servicios y posts
      const empresaPorNombre = new Map<string, Empresa>();
      for (const e of EMPRESAS) {
        const {
          propietarioEmail,
          servicios: nombresServicios,
          posts: postsData,
          ...datos
        } = e;
        let empresa = await empresas.findOne({ where: { nombre: e.nombre } });
        empresa = empresas.merge(empresa ?? empresas.create(), {
          ...datos,
          propietario: usuarioPorEmail.get(propietarioEmail)!,
        });
        empresa.servicios = nombresServicios.map((n) =>
          servicioPorNombre.get(n)!,
        );
        empresa = await empresas.save(empresa);
        empresaPorNombre.set(e.nombre, empresa);

        for (const p of postsData) {
          const existe = await posts.findOne({
            where: { titulo: p.titulo, empresa: { id: empresa.id } },
          });
          if (!existe) await posts.save(posts.create({ ...p, empresa }));
        }
      }
      logger.log(`Empresas: ${EMPRESAS.length}`);

      // Reseñas (una por usuario y empresa)
      for (const r of RESENAS) {
        const usuario = usuarioPorEmail.get(r.usuarioEmail)!;
        const empresa = empresaPorNombre.get(r.empresa)!;
        let resena = await resenas.findOne({
          where: { usuario: { id: usuario.id }, empresa: { id: empresa.id } },
        });
        resena = resenas.merge(resena ?? resenas.create(), {
          calificacion: r.calificacion,
          comentario: r.comentario,
          usuario,
          empresa,
        });
        await resenas.save(resena);
      }
      logger.log(`Reseñas: ${RESENAS.length}`);
    });

    logger.log('Seed completado.');
  } finally {
    await app.close();
  }
}

run().catch((err) => {
  logger.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
