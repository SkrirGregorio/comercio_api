import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { EmpresasService } from '../services/empresas.service';
import { CreateEmpresaDto, UpdateEmpresaDto } from '../dtos/empresa.dto';
import { Public } from '../../auth/decorators/public.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import type { JwtUser } from '../../auth/strategies/jwt.strategy';
import { Role } from '../../usuarios/entities/usuario.entity';

@Controller('empresas')
export class EmpresasController {
  constructor(private readonly empresasService: EmpresasService) {}

  @Public()
  @Get()
  findAll() {
    return this.empresasService.findAll();
  }

  @Get('mis-empresas')
  @Roles(Role.PROPIETARIO, Role.ADMIN)
  findMyEmpresas(@GetUser() user: JwtUser) {
    return this.empresasService.findByPropietario(user.userId);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.empresasService.findOne(id);
  }

  @Post()
  @Roles(Role.PROPIETARIO, Role.ADMIN)
  create(@Body() dto: CreateEmpresaDto, @GetUser() user: JwtUser) {
    return this.empresasService.create(dto, user.userId);
  }

  @Patch(':id')
  @Roles(Role.PROPIETARIO, Role.ADMIN)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEmpresaDto,
    @GetUser() user: JwtUser,
  ) {
    return this.empresasService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(Role.PROPIETARIO, Role.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number, @GetUser() user: JwtUser) {
    return this.empresasService.remove(id, user);
  }

  @Delete(':id/servicios/:servicioId')
  @Roles(Role.PROPIETARIO, Role.ADMIN)
  quitarServicio(
    @Param('id', ParseIntPipe) id: number,
    @Param('servicioId', ParseIntPipe) servicioId: number,
    @GetUser() user: JwtUser,
  ) {
    return this.empresasService.quitarServicio(id, servicioId, user);
  }
}
