import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateEmpresaDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsString()
  @IsNotEmpty()
  direccion: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsEmail({}, { message: 'email must be a valid email' })
  email?: string;

  @Type(() => Number)
  @IsNumber({}, { message: 'latitud must be a number' })
  latitud: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'longitud must be a number' })
  longitud: number;

  @IsOptional()
  @IsString()
  horario?: string;

  @IsOptional()
  @IsString()
  urlAvatar?: string;

  @IsOptional()
  @IsString()
  webSite?: string;

  @IsOptional()
  @IsString()
  urlPortada?: string;
}

export class UpdateEmpresaDto extends PartialType(CreateEmpresaDto) {}
