import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Resena } from './entities/resena.entity';
import { ResenasController } from './controllers/resenas.controller';
import { ResenasService } from './services/resenas.service';
import { Empresa } from 'src/empresas/entities/empresa.entity';
import { Usuario } from 'src/usuarios/entities/usuario.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Resena, Empresa, Usuario])],
  controllers: [ResenasController],
  providers: [ResenasService],
})
export class ResenasModule {}
