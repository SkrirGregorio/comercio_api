import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Usuario, Role } from '../entities/usuario.entity';
import { Repository } from 'typeorm';
import { CreateUsuarioDto } from '../dto/create-usuario.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsuarioService {
  constructor(
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
  ) {}

  async create(userDto: CreateUsuarioDto): Promise<Usuario> {
    const { email } = userDto;
    const validarEmail = await this.findByEmail(email);
    if (validarEmail) {
      throw new ConflictException(`El email '${email}' ya está registrado.`);
    }

    const hashedPassword = await bcrypt.hash(userDto.password, 10);

    userDto.password = hashedPassword;
    const usuario = this.usuarioRepository.create(userDto);

    return this.usuarioRepository.save(usuario);
  }

  async findByEmail(email: string): Promise<Usuario | null> {
    return this.usuarioRepository.findOne({ where: { email } });
  }

  async findOne(id: number): Promise<Usuario | null> {
    return this.usuarioRepository.findOne({ where: { id } });
  }

  async update(id: number, updateData: Partial<Usuario>): Promise<Usuario> {
    // Buscar el usuario actual
    const existingUser = await this.findOne(id);
    if (!existingUser) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Actualizar solo los campos que vienen en updateData (no undefined)
    Object.keys(updateData).forEach((key) => {
      const value = updateData[key as keyof Usuario];
      if (value !== undefined) {
        (existingUser as any)[key] = value;
      }
    });

    // Guardar y retornar
    return await this.usuarioRepository.save(existingUser);
  }

  async findAll(): Promise<Usuario[]> {
    return this.usuarioRepository.find({
      select: ['id', 'nombre', 'email', 'role', 'photoUrl', 'isActive', 'createdAt', 'updatedAt'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateRole(id: number, role: Role): Promise<Usuario> {
    const usuario = await this.findOne(id);
    if (!usuario) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    }

    usuario.role = role;
    return await this.usuarioRepository.save(usuario);
  }
}
