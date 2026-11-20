import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ServiciosService } from '../services/servicios.service';
import { CreateServicioDto, UpdateServicioDto } from '../dtos/servicio.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Public } from '../../auth/decorators/public.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../usuarios/entities/usuario.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('servicios')
export class ServiciosController {
  constructor(private readonly serviciosService: ServiciosService) {}

  @Post()
  @Roles(Role.ADMIN, Role.PROPIETARIO)
  create(@Body() createServicioDto: CreateServicioDto) {
    return this.serviciosService.create(createServicioDto);
  }

  @Public()
  @Get()
  findAll() {
    return this.serviciosService.findAll();
  }

  @Public()
  @Get('search')
  searchByName(@Query('nombre') nombre: string) {
    if (!nombre) {
      return this.serviciosService.findAll();
    }
    return this.serviciosService.searchByName(nombre);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.serviciosService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN) // Solo administradores pueden actualizar servicios
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateServicioDto: UpdateServicioDto,
  ) {
    return this.serviciosService.update(id, updateServicioDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN) // Solo administradores pueden eliminar servicios
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.serviciosService.remove(id);
  }
}
