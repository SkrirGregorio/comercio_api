import * as fs from 'fs/promises';
import * as path from 'path';
import { Bucket, Storage } from '@google-cloud/storage';

/**
 * Destino de los archivos subidos. `key` es una ruta relativa como
 * `avatars/<uuid>.png`, ya validada por UploadService.
 */
export interface FileStorage {
  save(key: string, data: Buffer, contentType: string): Promise<void>;
  /** true si el archivo existía y se eliminó */
  delete(key: string): Promise<boolean>;
  publicUrl(key: string): string;
}

/** Desarrollo: disco local, servido por la propia API en /uploads (ver main.ts). */
export class LocalFileStorage implements FileStorage {
  constructor(
    private readonly rootDir: string,
    private readonly baseUrl: string,
  ) {}

  async save(key: string, data: Buffer): Promise<void> {
    const filePath = path.join(this.rootDir, key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, data);
  }

  async delete(key: string): Promise<boolean> {
    try {
      await fs.unlink(path.join(this.rootDir, key));
      return true;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return false;
      throw err;
    }
  }

  publicUrl(key: string): string {
    return `${this.baseUrl}/uploads/${key}`;
  }
}

/**
 * Producción: bucket de Cloud Storage con lectura pública.
 * En Cloud Run se autentica con la cuenta de servicio del servicio (ADC), sin llaves.
 */
export class GcsFileStorage implements FileStorage {
  private readonly bucket: Bucket;

  constructor(
    bucketName: string,
    private readonly publicBaseUrl: string,
  ) {
    this.bucket = new Storage().bucket(bucketName);
  }

  async save(key: string, data: Buffer, contentType: string): Promise<void> {
    await this.bucket.file(key).save(data, {
      contentType,
      resumable: false,
      metadata: { cacheControl: 'public, max-age=31536000, immutable' },
    });
  }

  async delete(key: string): Promise<boolean> {
    try {
      await this.bucket.file(key).delete();
      return true;
    } catch (err) {
      if ((err as { code?: number }).code === 404) return false;
      throw err;
    }
  }

  publicUrl(key: string): string {
    return `${this.publicBaseUrl}/${key}`;
  }
}
