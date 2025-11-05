import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Servicio } from '../entities/servicio.entity';
import { CreateServicioDto, UpdateServicioDto } from '../dtos/servicio.dto';

@Injectable()
export class ServiciosService {
  constructor(
    @InjectRepository(Servicio)
    private readonly servicioRepo: Repository<Servicio>,
  ) {}

  async create(createServicioDto: CreateServicioDto): Promise<Servicio> {
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
    if (updateServicioDto.nombre && updateServicioDto.nombre !== servicio.nombre) {
      const servicioConMismoNombre = await this.servicioRepo.findOne({
        where: { nombre: updateServicioDto.nombre },
      });

      if (servicioConMismoNombre) {
        throw new ConflictException(
          `Ya existe un servicio con el nombre "${updateServicioDto.nombre}".`,
        );
      }
    }

    this.servicioRepo.merge(servicio, updateServicioDto);
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
