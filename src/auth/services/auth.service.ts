import { Injectable, NotFoundException } from '@nestjs/common';
import {
  CreateUsuarioDto,
  UpdateUsuarioDto,
} from '../../usuarios/dto/create-usuario.dto';
import { UsuarioService } from '../../usuarios/services/usuario.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private userService: UsuarioService,
    private jwtService: JwtService,
  ) {}

  async register(userDto: CreateUsuarioDto) {
    const nuevoUsuario = await this.userService.create(userDto);
    return nuevoUsuario;
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userService.findByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password: userPassword, ...result } = user;
      return result;
    }
    return null;
  }

  login(user: any) {
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async updateProfile(userId: number, updateData: UpdateUsuarioDto) {
    const user = await this.userService.findOne(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Actualizar directamente con los datos del DTO
    const updatedUser = await this.userService.update(userId, updateData);

    // Retornar usuario sin contraseña
    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  async getProfile(userId: number) {
    const user = await this.userService.findOne(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
