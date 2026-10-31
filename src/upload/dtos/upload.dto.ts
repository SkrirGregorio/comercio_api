import { IsEnum, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import { ImageType } from '../interfaces/upload.interface';

export class UploadImageDto {
  @IsEnum(ImageType)
  type: ImageType;

  @IsOptional()
  @Transform(({ value }) => parseInt(value as string, 10))
  @IsNumber()
  @Min(100)
  @Max(10 * 1024 * 1024) // 10MB máximo
  maxSize?: number;
}

export class DeleteImageDto {
  @IsEnum(ImageType)
  type: ImageType;
}
