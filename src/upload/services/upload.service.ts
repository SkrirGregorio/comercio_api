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

    // Generar nombre único con extensión
    const fileExtension = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExtension}`;

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
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      url: this.generateFileUrl(fileName, type),
    };
  }
}
