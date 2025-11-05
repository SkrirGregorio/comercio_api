import { IsInt, IsOptional, IsString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';

export class CreateResenaDto {
  @IsInt()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  calificacion: number;

  @IsOptional()
  @IsString()
  comentario?: string;

  @IsInt()
  @Type(() => Number)
  idEmpresa: number;
}

export class UpdateResenaDto extends PartialType(CreateResenaDto) {}
