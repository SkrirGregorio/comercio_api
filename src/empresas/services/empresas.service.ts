import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Empresa } from '../entities/empresa.entity';
import { CreateEmpresaDto, UpdateEmpresaDto } from '../dtos/empresa.dto';
import { Role, Usuario } from '../../usuarios/entities/usuario.entity';
import type { JwtUser } from '../../auth/strategies/jwt.strategy';

@Injectable()
export class EmpresasService {
  constructor(
    @InjectRepository(Empresa)
    private readonly empresaRepository: Repository<Empresa>,
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
  ) {}

  findAll(): Promise<Empresa[]> {
    return this.empresaRepository.find({
      relations: [
        'propietario',
        'posts',
        'servicios',
        'resenas',
        'resenas.usuario',
      ],
    });
  }

  findOne(id: number): Promise<Empresa | null> {
    return this.empresaRepository.findOne({
      where: { id },
      relations: [
        'propietario',
        'posts',
        'servicios',
        'resenas',
        'resenas.usuario',
      ],
    });
  }

  findByPropietario(propietarioId: number): Promise<Empresa[]> {
    return this.empresaRepository.find({
      where: { propietario: { id: propietarioId } },
      order: { fechaRegistro: 'DESC' },
    });
  }

  async create(dto: CreateEmpresaDto, propietarioId: number) {
    const propietario = await this.usuarioRepo.findOne({
      where: { id: propietarioId },
    });
    if (!propietario) {
      throw new NotFoundException('Usuario propietario no encontrado');
    }
    const nuevaEmpresa = this.empresaRepository.create({ ...dto, propietario });
    return this.empresaRepository.save(nuevaEmpresa);
  }

  async update(id: number, dto: UpdateEmpresaDto, user: JwtUser) {
    await this.findOwnedOrFail(id, user);
    await this.empresaRepository.update(id, dto);
    return this.empresaRepository.findOneBy({ id });
  }

  async remove(id: number, user: JwtUser): Promise<void> {
    await this.findOwnedOrFail(id, user);
    await this.empresaRepository.delete(id);
  }

  async quitarServicio(id: number, servicioId: number, user: JwtUser) {
    await this.findOwnedOrFail(id, user);
    await this.empresaRepository
      .createQueryBuilder()
      .relation(Empresa, 'servicios')
      .of(id)
      .remove(servicioId);
  }

  /**
   * Devuelve la empresa si el usuario es su propietario (o admin).
   * Lanza 404 si no existe y 403 si pertenece a otro usuario.
   */
  async findOwnedOrFail(id: number, user: JwtUser): Promise<Empresa> {
    const empresa = await this.empresaRepository.findOne({
      where: { id },
      relations: ['propietario'],
    });
    if (!empresa) {
      throw new NotFoundException(`Empresa con ID #${id} no encontrada.`);
    }
    if (user.role !== Role.ADMIN && empresa.propietario?.id !== user.userId) {
      throw new ForbiddenException('No tienes permiso sobre esta empresa.');
    }
    return empresa;
  }
}
