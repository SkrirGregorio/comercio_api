import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateServicioDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100, { message: 'El nombre no puede tener más de 100 caracteres' })
  nombre: string;

  @IsOptional()
  @IsString()
  descripcion?: string;
}

export class UpdateServicioDto extends PartialType(CreateServicioDto) {}
