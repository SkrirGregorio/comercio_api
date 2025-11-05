import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { EmpresasService } from '../services/empresas.service';
import { CreateEmpresaDto, UpdateEmpresaDto } from '../dtos/empresa.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Public } from 'src/auth/decorators/public.decorator';

@UseGuards(JwtAuthGuard)
@Controller('empresas')
export class EmpresasController {
  constructor(private readonly empresasService: EmpresasService) {}

  @Public()
  @Get()
  findAll() {
    return this.empresasService.findAll();
  }

  @Get('mis-empresas')
  findMyEmpresas(
    @Request() req: ExpressRequest & { user: { userId: number } },
  ) {
    const propietarioId = req.user.userId;
    return this.empresasService.findByPropietario(propietarioId);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.empresasService.findOne(+id);
  }

  @Post()
  create(
    @Body() createEmpresaDto: CreateEmpresaDto,
    @Request() req: ExpressRequest & { user: { userId: number } },
  ) {
    console.log('CreateEmpresaDto received:', req.user);
    const propietarioId = req.user.userId;
    console.log('User ID from token:', propietarioId);
    return this.empresasService.create(createEmpresaDto, propietarioId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEmpresaDto: UpdateEmpresaDto) {
    return this.empresasService.update(+id, updateEmpresaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.empresasService.remove(+id);
  }
}
