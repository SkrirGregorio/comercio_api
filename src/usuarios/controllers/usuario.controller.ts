import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  SerializeOptions,
  UseGuards,
} from '@nestjs/common';
import { UsuarioService } from '../services/usuario.service';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import type { JwtUser } from '../../auth/strategies/jwt.strategy';
import { Role } from '../entities/usuario.entity';
import { UpdateUsuarioDto } from '../dto/update-usuario.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';

@Controller('usuarios')
@UseGuards(RolesGuard)
@Roles(Role.ADMIN)
@SerializeOptions({ groups: ['private'] })
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) {}

  @Get()
  findAll() {
    return this.usuarioService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usuarioService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUsuarioDto) {
    return this.usuarioService.update(id, dto);
  }

  @Patch(':id/role')
  updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoleDto,
    @GetUser() user: JwtUser,
  ) {
    if (id === user.userId) {
      throw new BadRequestException('No puedes cambiar tu propio rol');
    }
    return this.usuarioService.updateRole(id, dto.role);
  }
}
