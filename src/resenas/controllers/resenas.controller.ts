import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { ResenasService } from '../services/resenas.service';
import { CreateResenaDto, UpdateResenaDto } from '../dtos/resena.dto';
import { Public } from '../../auth/decorators/public.decorator';
import { GetUser } from '../../auth/decorators/get-user.decorator';

@Controller('resenas')
export class ResenasController {
  constructor(private readonly resenasService: ResenasService) {}

  @Post()
  create(
    @Body() createResenaDto: CreateResenaDto,
    @GetUser('userId') userId: number,
  ) {
    return this.resenasService.create(createResenaDto, userId);
  }

  @Public()
  @Get()
  findAll() {
    return this.resenasService.findAll();
  }

  @Public()
  @Get('empresa/:empresaId')
  findByEmpresa(@Param('empresaId', ParseIntPipe) empresaId: number) {
    return this.resenasService.findByEmpresa(empresaId);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.resenasService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateResenaDto: UpdateResenaDto,
    @GetUser('userId') userId: number,
  ) {
    return this.resenasService.update(id, updateResenaDto, userId);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('userId') userId: number,
  ) {
    return this.resenasService.remove(id, userId);
  }
}
