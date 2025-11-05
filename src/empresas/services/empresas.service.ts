import { Injectable } from '@nestjs/common';
import { Empresa } from '../entities/empresa.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateEmpresaDto } from '../dtos/empresa.dto';
import { Usuario } from 'src/usuarios/entities/usuario.entity';

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

  async create(createEmpresaDto: CreateEmpresaDto, propietarioId: number) {
    const propietario = await this.usuarioRepo.findOne({
      where: { id: propietarioId },
    });
    if (!propietario) {
      throw new Error('Usuario propietario no encontrado');
    }

    const nuevaEmpresa = this.empresaRepository.create({
      ...createEmpresaDto,
      propietario,
    });

    return this.empresaRepository.save(nuevaEmpresa);
  }

  async update(id: number, empresa: Partial<Empresa>): Promise<Empresa | null> {
    await this.empresaRepository.update(id, empresa);
    return this.empresaRepository.findOneBy({ id });
  }

  async remove(id: number): Promise<void> {
    await this.empresaRepository.delete(id);
  }
}
