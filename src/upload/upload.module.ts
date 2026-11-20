import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UploadController } from './controllers/upload.controller';
import { UploadService } from './services/upload.service';

@Module({
  // Los controladores usan memoryStorage; UploadService decide el destino (disco o Cloud Storage)
  imports: [ConfigModule],
  controllers: [UploadController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}
