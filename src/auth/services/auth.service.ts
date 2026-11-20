import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UsuarioService } from '../../usuarios/services/usuario.service';
import { Role, Usuario } from '../../usuarios/entities/usuario.entity';
import { RegisterDto } from '../dtos/register.dto';
import { UpdateProfileDto } from '../dtos/update-profile.dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UsuarioService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const usuario = await this.userService.create({
      nombre: dto.nombre,
      email: dto.email,
      password: dto.password,
      role: dto.role ?? Role.CONSUMIDOR, // nunca admin desde el registro público
    });
    return this.login(usuario);
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userService.findByEmail(email);
    if (
      user &&
      user.isActive &&
      (await bcrypt.compare(password, user.password))
    ) {
      const { password: _password, ...result } = user;
      return result;
    }
    return null;
  }

  login(user: Pick<Usuario, 'id' | 'email' | 'role'>) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return { access_token: this.jwtService.sign(payload) };
  }

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    if (dto.email) {
      const existing = await this.userService.findByEmail(dto.email);
      if (existing && existing.id !== userId) {
        throw new ConflictException(
          `El email '${dto.email}' ya está registrado.`,
        );
      }
    }
    const updated = await this.userService.update(userId, {
      nombre: dto.nombre,
      email: dto.email,
      photoUrl: dto.photoUrl,
    });
    const { password: _password, ...rest } = updated;
    return rest;
  }

  async getProfile(userId: number) {
    const user = await this.userService.findOne(userId);
    if (!user || !user.isActive) {
      throw new NotFoundException('Usuario no encontrado');
    }
    const { password: _password, ...rest } = user;
    return rest;
  }
}
