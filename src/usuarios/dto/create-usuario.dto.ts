import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  MinLength,
} from 'class-validator';
import { Role } from '../entities/usuario.entity';
import { PartialType } from '@nestjs/mapped-types';

export class CreateUsuarioDto {
  @IsNotEmpty()
  nombre: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @IsOptional()
  photoUrl?: string;

  @IsEnum(Role, {
    message: 'El rol debe ser admin, user, consumidor o propietario',
  })
  @IsOptional()
  role: Role;
}

export class UpdateUsuarioDto extends PartialType(CreateUsuarioDto) {}
