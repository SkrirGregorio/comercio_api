import { Type } from 'class-transformer';
import {
  IsInt,
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateServicioDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100, { message: 'El nombre no puede tener más de 100 caracteres' })
  nombre: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  /** Empresa a la que se vinculará el servicio (debe pertenecer al usuario). */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  empresaId?: number;
}

export class UpdateServicioDto extends PartialType(CreateServicioDto) {}
