import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ServiciosService } from '../services/servicios.service';
import { CreateServicioDto, UpdateServicioDto } from '../dtos/servicio.dto';
import { Public } from '../../auth/decorators/public.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import type { JwtUser } from '../../auth/strategies/jwt.strategy';
import { Role } from '../../usuarios/entities/usuario.entity';

@Controller('servicios')
export class ServiciosController {
  constructor(private readonly serviciosService: ServiciosService) {}

  /**
   * Crea un servicio del catálogo. Si se envía `empresaId`, lo vincula a esa
   * empresa (reutilizando el servicio si ya existe con el mismo nombre).
   */
  @Post()
  @Roles(Role.ADMIN, Role.PROPIETARIO)
  create(@Body() dto: CreateServicioDto, @GetUser() user: JwtUser) {
    return this.serviciosService.create(dto, user);
  }

  @Public()
  @Get()
  findAll(@Query('empresaId') empresaId?: string) {
    const id = empresaId ? Number.parseInt(empresaId, 10) : NaN;
    return Number.isInteger(id)
      ? this.serviciosService.findByEmpresa(id)
      : this.serviciosService.findAll();
  }

  /** Catálogo con las empresas que ofrecen cada servicio: GET /servicios/catalogo?q=redes */
  @Public()
  @Get('catalogo')
  catalogo(@Query('q') q = '') {
    return this.serviciosService.catalogo(q);
  }

  @Public()
  @Get('search')
  searchByName(@Query('nombre') nombre = '') {
    return this.serviciosService.searchByName(nombre);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.serviciosService.findOne(id);
  }

  // El catálogo es compartido entre empresas: solo un admin puede editarlo o borrarlo.
  @Patch(':id')
  @Roles(Role.ADMIN)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateServicioDto,
  ) {
    return this.serviciosService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.serviciosService.remove(id);
  }
}
