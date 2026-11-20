import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import {
  ImageType,
  UploadResult,
  ImageUploadOptions,
} from '../interfaces/upload.interface';
import { v4 as uuidv4 } from 'uuid';

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
  private readonly uploadDir = path.join(process.cwd(), 'public', 'uploads');
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    this.baseUrl = this.configService.get('BASE_URL', 'http://localhost:3000');
    this.ensureUploadDirectories();
  }

  private ensureUploadDirectories() {
    const directories = [
      path.join(this.uploadDir, 'avatars'),
      path.join(this.uploadDir, 'portadas'),
      path.join(this.uploadDir, 'posts'),
    ];

    directories.forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  getMulterConfig(options: ImageUploadOptions): multer.Options {
    const {
      type,
      maxSize = 5 * 1024 * 1024,
      allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'],
    } = options;

    return {
      storage: multer.diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = path.join(
            this.uploadDir,
            this.getUploadSubdirectory(type),
          );
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const fileExtension = path.extname(file.originalname);
          const fileName = `${uuidv4()}${fileExtension}`;
          cb(null, fileName);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (allowedMimeTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(null, false);
        }
      },
      limits: {
        fileSize: maxSize,
      },
    };
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

  generateFileUrl(filename: string, type: ImageType): string {
    const subdirectory = this.getUploadSubdirectory(type);
    return `${this.baseUrl}/uploads/${subdirectory}/${filename}`;
  }

  processUploadResult(
    file: Express.Multer.File,
    type: ImageType,
  ): UploadResult {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    return {
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      url: this.generateFileUrl(file.filename, type),
    };
  }

  deleteFile(filename: string, type: ImageType): boolean {
    if (!SAFE_FILENAME.test(filename)) {
      throw new BadRequestException('Nombre de archivo inválido');
    }
    try {
      const subdirectory = this.getUploadSubdirectory(type);
      const filePath = path.join(this.uploadDir, subdirectory, filename);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting file:', error);
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

    // Obtener directorio de destino
    const subdirectory = this.getUploadSubdirectory(type);
    const uploadPath = path.join(this.uploadDir, subdirectory);
    const filePath = path.join(uploadPath, fileName);

    // Asegurar que el directorio existe
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    // Escribir el archivo
    fs.writeFileSync(filePath, file.buffer);

    return {
      filename: fileName,
      originalName: path.basename(file.originalname),
      size: file.size,
      mimetype: detected.mime,
      url: this.generateFileUrl(fileName, type),
    };
  }
}
