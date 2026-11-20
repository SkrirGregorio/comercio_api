import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Servicio } from './entities/servicio.entity';
import { Empresa } from '../empresas/entities/empresa.entity';
import { ServiciosController } from './controllers/servicios.controller';
import { ServiciosService } from './services/servicios.service';

@Module({
  imports: [TypeOrmModule.forFeature([Servicio, Empresa])],
  controllers: [ServiciosController],
  providers: [ServiciosService],
})
export class ServiciosModule {}
