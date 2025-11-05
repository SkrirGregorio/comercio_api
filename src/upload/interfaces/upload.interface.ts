export enum ImageType {
  AVATAR = 'avatar',
  PORTADA = 'portada',
  POST = 'post',
}

export interface UploadResult {
  filename: string;
  originalName: string;
  size: number;
  mimetype: string;
  url: string;
}

export interface ImageUploadOptions {
  type: ImageType;
  maxSize?: number;
  allowedMimeTypes?: string[];
}