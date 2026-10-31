import {
  Controller,
  Post,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  Body,
  BadRequestException,
  UseGuards,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import { UploadService } from '../services/upload.service';
import { UploadImageDto, DeleteImageDto } from '../dtos/upload.dto';
import { ImageType, UploadResult } from '../interfaces/upload.interface';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB máximo
    }),
  )
  uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Query() uploadDto: UploadImageDto,
  ): Promise<UploadResult> {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    // Validar tipo de archivo
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!this.uploadService.validateFileType(file, allowedMimeTypes)) {
      throw new BadRequestException(
        `Tipo de archivo no permitido. Solo se permiten: ${allowedMimeTypes.join(', ')}`,
      );
    }

    // Validar tamaño específico por tipo
    const maxSizes = {
      [ImageType.AVATAR]: 2 * 1024 * 1024, // 2MB
      [ImageType.PORTADA]: 5 * 1024 * 1024, // 5MB
      [ImageType.POST]: 3 * 1024 * 1024, // 3MB
    };

    const maxSize = uploadDto.maxSize || maxSizes[uploadDto.type];
    if (file.size > maxSize) {
      throw new BadRequestException(
        `El archivo es demasiado grande. Tamaño máximo: ${Math.round(maxSize / 1024 / 1024)}MB`,
      );
    }

    return this.uploadService.saveUploadedFile(file, uploadDto.type);
  }

  @Post('avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.memoryStorage(),
      limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    }),
  )
  uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UploadResult> {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!this.uploadService.validateFileType(file, allowedMimeTypes)) {
      throw new BadRequestException(
        `Tipo de archivo no permitido. Solo se permiten: ${allowedMimeTypes.join(', ')}`,
      );
    }

    if (file.size > 2 * 1024 * 1024) {
      throw new BadRequestException('El avatar no puede ser mayor a 2MB');
    }

    // Procesar y mover el archivo usando el servicio
    return this.uploadService.saveUploadedFile(file, ImageType.AVATAR);
  }

  @Post('portada')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }),
  )
  uploadPortada(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UploadResult> {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!this.uploadService.validateFileType(file, allowedMimeTypes)) {
      throw new BadRequestException(
        `Tipo de archivo no permitido. Solo se permiten: ${allowedMimeTypes.join(', ')}`,
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('La portada no puede ser mayor a 5MB');
    }

    return this.uploadService.saveUploadedFile(file, ImageType.PORTADA);
  }

  @Post('post-image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.memoryStorage(),
      limits: { fileSize: 3 * 1024 * 1024 }, // 3MB
    }),
  )
  uploadPostImage(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UploadResult> {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!this.uploadService.validateFileType(file, allowedMimeTypes)) {
      throw new BadRequestException(
        `Tipo de archivo no permitido. Solo se permiten: ${allowedMimeTypes.join(', ')}`,
      );
    }

    if (file.size > 3 * 1024 * 1024) {
      throw new BadRequestException(
        'La imagen del post no puede ser mayor a 3MB',
      );
    }

    return this.uploadService.saveUploadedFile(file, ImageType.POST);
  }

  @Delete('image/:filename')
  deleteImage(
    @Param('filename') filename: string,
    @Body() deleteDto: DeleteImageDto,
  ): { success: boolean; message: string } {
    const deleted = this.uploadService.deleteFile(filename, deleteDto.type);

    if (deleted) {
      return {
        success: true,
        message: 'Archivo eliminado correctamente',
      };
    } else {
      return {
        success: false,
        message: 'No se pudo eliminar el archivo o no existe',
      };
    }
  }
}
