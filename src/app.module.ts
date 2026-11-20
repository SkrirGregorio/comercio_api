import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { EmpresasModule } from './empresas/empresas.module';
import { PostsModule } from './posts/posts.module';
import { ResenasModule } from './resenas/resenas.module';
import { ServiciosModule } from './servicios/servicios.module';
import { UploadModule } from './upload/upload.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Límite general por IP; login/registro tienen límites más estrictos en su controlador
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASS'),
        database: configService.get<string>('DB_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        autoLoadEntities: true,
        // En producción conviene desactivarlo (DB_SYNC=false) y usar migraciones
        synchronize: configService.get<string>('DB_SYNC', 'true') === 'true',
      }),
    }),
    AuthModule,
    UsuariosModule,
    EmpresasModule,
    PostsModule,
    ResenasModule,
    ServiciosModule,
    UploadModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Orden: rate limit -> autenticación JWT (salvo @Public) -> roles (@Roles)
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
