import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import { ImageType, UploadResult } from '../interfaces/upload.interface';
import { v4 as uuidv4 } from 'uuid';
import {
  FileStorage,
  GcsFileStorage,
  LocalFileStorage,
} from '../storage/file-storage';

/** Detecta el tipo real de imagen por su firma (magic bytes). */
function detectImageType(buf: Buffer): { mime: string; ext: string } | null {
  if (
    buf.length >= 3 &&
    buf[0] === 0xff &&
    buf[1] === 0xd8 &&
    buf[2] === 0xff
  ) {
    return { mime: 'image/jpeg', ext: '.jpg' };
  }
  if (
    buf.length >= 8 &&
    buf
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return { mime: 'image/png', ext: '.png' };
  }
  if (
    buf.length >= 12 &&
    buf.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buf.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return { mime: 'image/webp', ext: '.webp' };
  }
  return null;
}

/** Nombres generados por este servicio: <uuid>.<ext>. Evita path traversal al borrar. */
const SAFE_FILENAME = /^[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$/i;

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly storage: FileStorage;

  constructor(configService: ConfigService) {
    // Con GCS_BUCKET definido (producción en Cloud Run) se usa Cloud Storage;
    // sin él, disco local en public/uploads (desarrollo).
    const bucket = configService.get<string>('GCS_BUCKET');
    if (bucket) {
      const publicBase = configService.get<string>(
        'GCS_PUBLIC_URL',
        `https://storage.googleapis.com/${bucket}`,
      );
      this.storage = new GcsFileStorage(bucket, publicBase.replace(/\/+$/, ''));
      this.logger.log(`Archivos subidos en Cloud Storage: gs://${bucket}`);
    } else {
      this.storage = new LocalFileStorage(
        path.join(process.cwd(), 'public', 'uploads'),
        configService.get('BASE_URL', 'http://localhost:3000'),
      );
    }
  }

  private getUploadSubdirectory(type: ImageType): string {
    switch (type) {
      case ImageType.AVATAR:
        return 'avatars';
      case ImageType.PORTADA:
        return 'portadas';
      case ImageType.POST:
        return 'posts';
      default:
        return 'misc';
    }
  }

  async deleteFile(filename: string, type: ImageType): Promise<boolean> {
    if (!SAFE_FILENAME.test(filename)) {
      throw new BadRequestException('Nombre de archivo inválido');
    }
    try {
      return await this.storage.delete(
        `${this.getUploadSubdirectory(type)}/${filename}`,
      );
    } catch (error) {
      this.logger.error('Error al eliminar archivo', error as Error);
      return false;
    }
  }

  validateFileType(file: Express.Multer.File, allowedTypes: string[]): boolean {
    return allowedTypes.includes(file.mimetype);
  }

  async saveUploadedFile(
    file: Express.Multer.File,
    type: ImageType,
  ): Promise<UploadResult> {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    // El tipo y la extensión se derivan del contenido real, no de lo que declara el cliente
    const detected = detectImageType(file.buffer);
    if (!detected) {
      throw new BadRequestException(
        'El archivo no es una imagen válida (JPEG, PNG o WebP).',
      );
    }
    const fileName = `${uuidv4()}${detected.ext}`;
    const key = `${this.getUploadSubdirectory(type)}/${fileName}`;

    await this.storage.save(key, file.buffer, detected.mime);

    return {
      filename: fileName,
      originalName: path.basename(file.originalname),
      size: file.size,
      mimetype: detected.mime,
      url: this.storage.publicUrl(key),
    };
  }
}
