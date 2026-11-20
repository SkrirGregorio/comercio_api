import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Resena } from '../entities/resena.entity';
import { CreateResenaDto, UpdateResenaDto } from '../dtos/resena.dto';
import { Empresa } from '../../empresas/entities/empresa.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';

@Injectable()
export class ResenasService {
  constructor(
    @InjectRepository(Resena)
    private readonly resenaRepo: Repository<Resena>,
    @InjectRepository(Empresa)
    private readonly empresaRepo: Repository<Empresa>,
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
  ) {}

  async create(
    createResenaDto: CreateResenaDto,
    userId: number,
  ): Promise<Resena> {
    const { idEmpresa, ...resenaData } = createResenaDto;

    // 1. Verificar que la empresa existe
    const empresa = await this.empresaRepo.findOne({
      where: { id: idEmpresa },
    });

    if (!empresa) {
      throw new NotFoundException(
        `Empresa con ID #${idEmpresa} no encontrada.`,
      );
    }

    const usuario = await this.usuarioRepo.findOne({
      where: { id: userId },
    });

    if (!usuario) {
      throw new NotFoundException(`Usuario con ID #${userId} no encontrado.`);
    }

    const empresaConPropietario = await this.empresaRepo.findOne({
      where: { id: idEmpresa },
      relations: ['propietario'],
    });

    if (empresaConPropietario?.propietario?.id === userId) {
      throw new BadRequestException('No puedes reseñar tu propia empresa.');
    }

    const resenaExistente = await this.resenaRepo.findOne({
      where: {
        empresa: { id: idEmpresa },
        usuario: { id: userId },
      },
    });

    if (resenaExistente) {
      throw new BadRequestException('Ya has reseñado esta empresa.');
    }

    const nuevaResena = this.resenaRepo.create({
      ...resenaData,
      empresa,
      usuario,
    });

    return this.resenaRepo.save(nuevaResena);
  }

  findAll(): Promise<Resena[]> {
    return this.resenaRepo.find({
      relations: ['empresa', 'usuario'],
    });
  }

  async findByEmpresa(empresaId: number): Promise<Resena[]> {
    const empresa = await this.empresaRepo.findOne({
      where: { id: empresaId },
    });

    if (!empresa) {
      throw new NotFoundException(
        `Empresa con ID #${empresaId} no encontrada.`,
      );
    }

    return this.resenaRepo.find({
      where: { empresa: { id: empresaId } },
      relations: ['usuario'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Resena> {
    const resena = await this.resenaRepo.findOne({
      where: { id },
      relations: ['empresa', 'usuario'],
    });

    if (!resena) {
      throw new NotFoundException(`Reseña con ID #${id} no encontrada.`);
    }

    return resena;
  }

  async update(
    id: number,
    updateResenaDto: UpdateResenaDto,
    userId: number,
  ): Promise<Resena> {
    const resena = await this.findOne(id);

    // Verificar que el usuario que actualiza es el autor de la reseña
    if (!resena.usuario || resena.usuario.id !== userId) {
      throw new UnauthorizedException(
        'Solo puedes editar tus propias reseñas.',
      );
    }

    // No permitir cambiar la empresa en una actualización
    const { idEmpresa, ...updateData } = updateResenaDto;

    this.resenaRepo.merge(resena, updateData);
    return this.resenaRepo.save(resena);
  }

  async remove(id: number, userId: number): Promise<void> {
    const resena = await this.findOne(id);

    // Verificar que el usuario que elimina es el autor de la reseña
    if (!resena.usuario || resena.usuario.id !== userId) {
      throw new UnauthorizedException(
        'Solo puedes eliminar tus propias reseñas.',
      );
    }

    const result = await this.resenaRepo.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Reseña con ID #${id} no encontrada.`);
    }
  }
}
