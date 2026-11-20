import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Servicio } from '../entities/servicio.entity';
import { CreateServicioDto, UpdateServicioDto } from '../dtos/servicio.dto';
import { Empresa } from '../../empresas/entities/empresa.entity';
import { Role } from '../../usuarios/entities/usuario.entity';
import type { JwtUser } from '../../auth/strategies/jwt.strategy';

@Injectable()
export class ServiciosService {
  constructor(
    @InjectRepository(Servicio)
    private readonly servicioRepo: Repository<Servicio>,
    @InjectRepository(Empresa)
    private readonly empresaRepo: Repository<Empresa>,
  ) {}

  async create(dto: CreateServicioDto, user: JwtUser): Promise<Servicio> {
    const { empresaId, ...datos } = dto;

    // Sin empresa: alta en el catálogo general (solo admin)
    if (empresaId === undefined) {
      if (user.role !== Role.ADMIN) {
        throw new ForbiddenException(
          'Indica la empresa a la que pertenece el servicio.',
        );
      }
      return this.crearEnCatalogo(datos);
    }

    const empresa = await this.empresaRepo.findOne({
      where: { id: empresaId },
      relations: ['propietario', 'servicios'],
    });
    if (!empresa) {
      throw new NotFoundException(
        `Empresa con ID #${empresaId} no encontrada.`,
      );
    }
    if (user.role !== Role.ADMIN && empresa.propietario?.id !== user.userId) {
      throw new ForbiddenException('No tienes permiso sobre esta empresa.');
    }

    // Reutiliza el servicio del catálogo si ya existe (sin distinguir mayúsculas)
    const servicio =
      (await this.servicioRepo
        .createQueryBuilder('s')
        .where('LOWER(s.nombre) = LOWER(:nombre)', { nombre: datos.nombre })
        .getOne()) ??
      (await this.servicioRepo.save(this.servicioRepo.create(datos)));

    if (!empresa.servicios.some((s) => s.id === servicio.id)) {
      await this.empresaRepo
        .createQueryBuilder()
        .relation(Empresa, 'servicios')
        .of(empresa.id)
        .add(servicio.id);
    }
    return servicio;
  }

  findByEmpresa(empresaId: number): Promise<Servicio[]> {
    return this.servicioRepo.find({
      where: { empresas: { id: empresaId } },
      order: { nombre: 'ASC' },
    });
  }

  private async crearEnCatalogo(
    createServicioDto: Omit<CreateServicioDto, 'empresaId'>,
  ): Promise<Servicio> {
    // Verificar que no exista ya un servicio con el mismo nombre
    const servicioExistente = await this.servicioRepo.findOne({
      where: { nombre: createServicioDto.nombre },
    });

    if (servicioExistente) {
      throw new ConflictException(
        `Ya existe un servicio con el nombre "${createServicioDto.nombre}".`,
      );
    }

    const nuevoServicio = this.servicioRepo.create(createServicioDto);
    return this.servicioRepo.save(nuevoServicio);
  }

  findAll(): Promise<Servicio[]> {
    return this.servicioRepo.find({
      order: { nombre: 'ASC' }, // Ordenar alfabéticamente
    });
  }

  async findOne(id: number): Promise<Servicio> {
    const servicio = await this.servicioRepo.findOne({
      where: { id },
      relations: ['empresas'], // Cargar las empresas que ofrecen este servicio
    });

    if (!servicio) {
      throw new NotFoundException(`Servicio con ID #${id} no encontrado.`);
    }

    return servicio;
  }

  async update(
    id: number,
    updateServicioDto: UpdateServicioDto,
  ): Promise<Servicio> {
    const servicio = await this.servicioRepo.findOne({ where: { id } });

    if (!servicio) {
      throw new NotFoundException(`Servicio con ID #${id} no encontrado.`);
    }

    // Si se está actualizando el nombre, verificar que no exista otro con ese nombre
    if (
      updateServicioDto.nombre &&
      updateServicioDto.nombre !== servicio.nombre
    ) {
      const servicioConMismoNombre = await this.servicioRepo.findOne({
        where: { nombre: updateServicioDto.nombre },
      });

      if (servicioConMismoNombre) {
        throw new ConflictException(
          `Ya existe un servicio con el nombre "${updateServicioDto.nombre}".`,
        );
      }
    }

    const { empresaId: _empresaId, ...datos } = updateServicioDto;
    this.servicioRepo.merge(servicio, datos);
    return this.servicioRepo.save(servicio);
  }

  async remove(id: number): Promise<void> {
    const servicio = await this.servicioRepo.findOne({
      where: { id },
      relations: ['empresas'],
    });

    if (!servicio) {
      throw new NotFoundException(`Servicio con ID #${id} no encontrado.`);
    }

    // Verificar si hay empresas usando este servicio
    if (servicio.empresas && servicio.empresas.length > 0) {
      throw new ConflictException(
        `No se puede eliminar el servicio "${servicio.nombre}" porque está siendo usado por ${servicio.empresas.length} empresa(s).`,
      );
    }

    await this.servicioRepo.delete(id);
  }

  // Método adicional para buscar servicios por nombre (útil para autocompletado)
  async searchByName(nombre: string): Promise<Servicio[]> {
    return this.servicioRepo
      .createQueryBuilder('servicio')
      .where('servicio.nombre ILIKE :nombre', { nombre: `%${nombre}%` })
      .orderBy('servicio.nombre', 'ASC')
      .getMany();
  }
}
