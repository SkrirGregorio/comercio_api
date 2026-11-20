import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1795181928073 implements MigrationInterface {
  name = 'InitialSchema1795181928073';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "servicios" ("id_servicio" SERIAL NOT NULL, "nombre" character varying(100) NOT NULL, "descripcion" text, CONSTRAINT "UQ_e870cfd3490043d3d916aae9dda" UNIQUE ("nombre"), CONSTRAINT "PK_f07b149d3dd3cee237e2efe4922" PRIMARY KEY ("id_servicio"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "resenas" ("id_resena" SERIAL NOT NULL, "calificacion" integer NOT NULL, "comentario" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "id_empresa" integer NOT NULL, "id_usuario" integer, CONSTRAINT "PK_bfd17dd77843f845b21f99ac160" PRIMARY KEY ("id_resena"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "posts" ("id_post" SERIAL NOT NULL, "titulo" character varying(255) NOT NULL, "contenido" text NOT NULL, "urlImagen" character varying(255), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "id_empresa" integer NOT NULL, CONSTRAINT "PK_3f6b287bd4de2d788acf407f7e7" PRIMARY KEY ("id_post"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "empresas" ("id_empresa" SERIAL NOT NULL, "nombre_empresa" character varying(150) NOT NULL, "descripcion" text, "direccion" character varying(255) NOT NULL, "telefono" character varying(20), "latitud" numeric(10,8) NOT NULL, "longitud" numeric(11,8) NOT NULL, "horario" character varying(255), "url_avatar" character varying(255), "url_portada" character varying(255), "web_site" character varying(255), "fecha_registro" TIMESTAMP NOT NULL DEFAULT now(), "email" character varying(100), "id_propietario" integer NOT NULL, CONSTRAINT "UQ_fe5e0374ec6d7d7dfbe04446903" UNIQUE ("email"), CONSTRAINT "PK_b14c38cf8cfb35f23b693d0afb0" PRIMARY KEY ("id_empresa"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."usuarios_role_enum" AS ENUM('admin', 'consumidor', 'propietario')`,
    );
    await queryRunner.query(
      `CREATE TABLE "usuarios" ("id" SERIAL NOT NULL, "nombre" character varying(100) NOT NULL, "email" character varying(100) NOT NULL, "password" character varying(100) NOT NULL, "role" "public"."usuarios_role_enum" NOT NULL DEFAULT 'consumidor', "photoUrl" character varying(500), "isActive" boolean NOT NULL DEFAULT true, "google_id" character varying(500), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_446adfc18b35418aac32ae0b7b5" UNIQUE ("email"), CONSTRAINT "PK_d7281c63c176e152e4c531594a8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "empresa_servicios" ("id_empresa" integer NOT NULL, "id_servicio" integer NOT NULL, CONSTRAINT "PK_9a665e6a2470e6ac605a50403ec" PRIMARY KEY ("id_empresa", "id_servicio"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b086fe4693428f4d520f63bc3a" ON "empresa_servicios" ("id_empresa") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_acae37271ba3cf55bb98c1a0e8" ON "empresa_servicios" ("id_servicio") `,
    );
    await queryRunner.query(
      `ALTER TABLE "resenas" ADD CONSTRAINT "FK_d12fabe236877d6c6dfbafa1021" FOREIGN KEY ("id_empresa") REFERENCES "empresas"("id_empresa") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "resenas" ADD CONSTRAINT "FK_59f818e2c1a021702892576c6ee" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" ADD CONSTRAINT "FK_6ba3c5c8b489b5cba4d8b9fa355" FOREIGN KEY ("id_empresa") REFERENCES "empresas"("id_empresa") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "empresas" ADD CONSTRAINT "FK_26c5883c80b27971d0d7571026f" FOREIGN KEY ("id_propietario") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "empresa_servicios" ADD CONSTRAINT "FK_b086fe4693428f4d520f63bc3a0" FOREIGN KEY ("id_empresa") REFERENCES "empresas"("id_empresa") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "empresa_servicios" ADD CONSTRAINT "FK_acae37271ba3cf55bb98c1a0e8d" FOREIGN KEY ("id_servicio") REFERENCES "servicios"("id_servicio") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "empresa_servicios" DROP CONSTRAINT "FK_acae37271ba3cf55bb98c1a0e8d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "empresa_servicios" DROP CONSTRAINT "FK_b086fe4693428f4d520f63bc3a0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "empresas" DROP CONSTRAINT "FK_26c5883c80b27971d0d7571026f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" DROP CONSTRAINT "FK_6ba3c5c8b489b5cba4d8b9fa355"`,
    );
    await queryRunner.query(
      `ALTER TABLE "resenas" DROP CONSTRAINT "FK_59f818e2c1a021702892576c6ee"`,
    );
    await queryRunner.query(
      `ALTER TABLE "resenas" DROP CONSTRAINT "FK_d12fabe236877d6c6dfbafa1021"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_acae37271ba3cf55bb98c1a0e8"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b086fe4693428f4d520f63bc3a"`,
    );
    await queryRunner.query(`DROP TABLE "empresa_servicios"`);
    await queryRunner.query(`DROP TABLE "usuarios"`);
    await queryRunner.query(`DROP TYPE "public"."usuarios_role_enum"`);
    await queryRunner.query(`DROP TABLE "empresas"`);
    await queryRunner.query(`DROP TABLE "posts"`);
    await queryRunner.query(`DROP TABLE "resenas"`);
    await queryRunner.query(`DROP TABLE "servicios"`);
  }
}
