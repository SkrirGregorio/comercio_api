# 📸 Guía de Upload de Imágenes - API Comercio

## 🎯 Endpoints de Upload

### Base URL
```
http://localhost:3000
```

---

## 📤 1. Subir Avatar (Perfil de Usuario o Empresa)

### Endpoint
```http
POST /upload/avatar
```

### Headers
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: multipart/form-data
```

### Body (FormData)
```javascript
const formData = new FormData();
formData.append('file', fileBlob, 'avatar.jpg');
```

### Restricciones
- **Tamaño máximo:** 2MB
- **Formatos permitidos:** JPEG, PNG, WebP
- **Campo del formulario:** `file`

### Respuesta Exitosa (200)
```json
{
  "filename": "8c31dc64-0806-9baf-8af5-aa16fdd8998e.png",
  "originalName": "mi-avatar.png",
  "size": 289609,
  "mimetype": "image/png",
  "url": "http://localhost:3000/uploads/avatars/8c31dc64-0806-9baf-8af5-aa16fdd8998e.png"
}
```

### Ejemplo Angular/TypeScript
```typescript
uploadAvatar(file: File): Observable<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  
  return this.http.post<UploadResponse>(
    `${this.API_URL}/upload/avatar`,
    formData,
    {
      headers: {
        'Authorization': `Bearer ${this.getToken()}`
      }
    }
  );
}
```

### Ejemplo Fetch (JavaScript)
```javascript
async function uploadAvatar(file) {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('http://localhost:3000/upload/avatar', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: formData
  });
  
  return await response.json();
}
```

---

## 📤 2. Subir Portada (Cover de Empresa)

### Endpoint
```http
POST /upload/portada
```

### Headers
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: multipart/form-data
```

### Body (FormData)
```javascript
const formData = new FormData();
formData.append('file', fileBlob, 'portada.jpg');
```

### Restricciones
- **Tamaño máximo:** 5MB
- **Formatos permitidos:** JPEG, PNG, WebP
- **Campo del formulario:** `file`

### Respuesta Exitosa (200)
```json
{
  "filename": "d2dd681c-7632-525e-b305-ccdbcb702d88.jpg",
  "originalName": "portada-empresa.jpg",
  "size": 1048576,
  "mimetype": "image/jpeg",
  "url": "http://localhost:3000/uploads/portadas/d2dd681c-7632-525e-b305-ccdbcb702d88.jpg"
}
```

---

## 📤 3. Subir Imagen de Post

### Endpoint
```http
POST /upload/post-image
```

### Headers
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: multipart/form-data
```

### Body (FormData)
```javascript
const formData = new FormData();
formData.append('file', fileBlob, 'post.jpg');
```

### Restricciones
- **Tamaño máximo:** 3MB
- **Formatos permitidos:** JPEG, PNG, WebP
- **Campo del formulario:** `file`

### Respuesta Exitosa (200)
```json
{
  "filename": "573c3612-b1d7-5076-37f5-4627f35ba5cf.webp",
  "originalName": "imagen-post.webp",
  "size": 524288,
  "mimetype": "image/webp",
  "url": "http://localhost:3000/uploads/posts/573c3612-b1d7-5076-37f5-4627f35ba5cf.webp"
}
```

---

## 🗑️ 4. Eliminar Imagen

### Endpoint
```http
DELETE /upload/image/:filename
```

### Headers
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

### Body (JSON)
```json
{
  "type": "avatar" | "portada" | "post"
}
```

### Ejemplo
```http
DELETE /upload/image/8c31dc64-0806-9baf-8af5-aa16fdd8998e.png
Content-Type: application/json

{
  "type": "avatar"
}
```

### Respuesta Exitosa (200)
```json
{
  "success": true,
  "message": "Archivo eliminado correctamente"
}
```

---

## 🔗 Uso de URLs de Imágenes

### Después de Subir, Usar la URL Retornada

#### Para Actualizar Perfil de Usuario:
```http
POST /auth/update
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "nombre": "Juan Pérez",
  "photoUrl": "http://localhost:3000/uploads/avatars/8c31dc64-0806-9baf-8af5-aa16fdd8998e.png"
}
```

#### Para Crear/Actualizar Empresa:
```http
POST /empresas
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "nombre": "Mi Empresa",
  "descripcion": "Descripción de mi empresa",
  "direccion": "Calle 123",
  "latitud": -33.4489,
  "longitud": -70.6693,
  "urlAvatar": "http://localhost:3000/uploads/avatars/uuid.png",
  "urlPortada": "http://localhost:3000/uploads/portadas/uuid.jpg"
}
```

#### Para Crear Post:
```http
POST /posts
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "titulo": "Nuevo Post",
  "contenido": "Contenido del post",
  "imagenUrl": "http://localhost:3000/uploads/posts/uuid.jpg",
  "empresaId": 1
}
```

---

## 🎨 Componente Angular Completo de Upload

### TypeScript Service
```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface UploadResponse {
  filename: string;
  originalName: string;
  size: number;
  mimetype: string;
  url: string;
}

@Injectable({
  providedIn: 'root'
})
export class UploadService {
  private apiUrl = 'http://localhost:3000/upload';

  constructor(private http: HttpClient) {}

  uploadAvatar(file: File): Observable<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.http.post<UploadResponse>(`${this.apiUrl}/avatar`, formData);
  }

  uploadPortada(file: File): Observable<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.http.post<UploadResponse>(`${this.apiUrl}/portada`, formData);
  }

  uploadPostImage(file: File): Observable<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.http.post<UploadResponse>(`${this.apiUrl}/post-image`, formData);
  }

  deleteImage(filename: string, type: 'avatar' | 'portada' | 'post'): Observable<any> {
    return this.http.delete(`${this.apiUrl}/image/${filename}`, {
      body: { type }
    });
  }

  // Upload con progress
  uploadWithProgress(file: File, endpoint: string): Observable<number> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.http.post(`${this.apiUrl}/${endpoint}`, formData, {
      reportProgress: true,
      observe: 'events'
    }).pipe(
      map((event: HttpEvent<any>) => {
        if (event.type === HttpEventType.UploadProgress) {
          return Math.round((100 * event.loaded) / event.total!);
        }
        return 0;
      })
    );
  }
}
```

### Componente de Upload
```typescript
import { Component } from '@angular/core';
import { UploadService, UploadResponse } from './upload.service';

@Component({
  selector: 'app-image-upload',
  template: `
    <div class="upload-container">
      <!-- Preview de la imagen -->
      <div *ngIf="imagePreview" class="preview">
        <img [src]="imagePreview" alt="Preview">
      </div>

      <!-- Input file (hidden) -->
      <input 
        type="file" 
        #fileInput
        (change)="onFileSelected($event)"
        accept="image/jpeg,image/png,image/webp"
        hidden
      >

      <!-- Botón para seleccionar archivo -->
      <button 
        (click)="fileInput.click()"
        [disabled]="uploading"
        class="btn-upload"
      >
        {{ uploading ? 'Subiendo...' : 'Seleccionar Imagen' }}
      </button>

      <!-- Progress bar -->
      <div *ngIf="uploading" class="progress-bar">
        <div [style.width.%]="uploadProgress"></div>
      </div>

      <!-- Mensaje de error -->
      <div *ngIf="errorMessage" class="error">
        {{ errorMessage }}
      </div>

      <!-- URL de imagen subida -->
      <div *ngIf="uploadedUrl" class="success">
        <p>Imagen subida exitosamente!</p>
        <input [value]="uploadedUrl" readonly>
      </div>
    </div>
  `
})
export class ImageUploadComponent {
  imagePreview: string | null = null;
  uploading = false;
  uploadProgress = 0;
  errorMessage = '';
  uploadedUrl = '';
  selectedFile: File | null = null;

  constructor(private uploadService: UploadService) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    // Validar tipo
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      this.errorMessage = 'Solo se permiten imágenes JPG, PNG o WebP';
      return;
    }

    // Validar tamaño (2MB para avatar)
    if (file.size > 2 * 1024 * 1024) {
      this.errorMessage = 'La imagen no puede superar 2MB';
      return;
    }

    this.selectedFile = file;
    this.errorMessage = '';

    // Preview
    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result as string;
    };
    reader.readAsDataURL(file);

    // Subir automáticamente
    this.uploadImage();
  }

  uploadImage(): void {
    if (!this.selectedFile) return;

    this.uploading = true;
    this.uploadProgress = 0;

    this.uploadService.uploadAvatar(this.selectedFile).subscribe({
      next: (response: UploadResponse) => {
        this.uploadedUrl = response.url;
        this.uploading = false;
        console.log('Upload exitoso:', response);
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Error al subir la imagen';
        this.uploading = false;
      }
    });
  }
}
```

---

## ⚠️ Manejo de Errores

### Errores Comunes

#### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "No se proporcionó ningún archivo",
  "error": "Bad Request"
}
```

#### 400 - Tipo de archivo no permitido
```json
{
  "statusCode": 400,
  "message": "Tipo de archivo no permitido. Solo se permiten: image/jpeg, image/png, image/webp",
  "error": "Bad Request"
}
```

#### 400 - Archivo muy grande
```json
{
  "statusCode": 400,
  "message": "El avatar no puede ser mayor a 2MB",
  "error": "Bad Request"
}
```

#### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```
**Solución:** Asegúrate de incluir el token JWT en el header `Authorization: Bearer {token}`

---

## 📋 Checklist de Implementación Frontend

- [ ] Crear servicio de upload con métodos para cada tipo de imagen
- [ ] Implementar componente de upload con preview
- [ ] Validar tipo de archivo antes de enviar (JPEG, PNG, WebP)
- [ ] Validar tamaño de archivo según tipo:
  - [ ] Avatar: 2MB máximo
  - [ ] Portada: 5MB máximo
  - [ ] Post: 3MB máximo
- [ ] Mostrar progress bar durante upload
- [ ] Manejar errores y mostrar mensajes al usuario
- [ ] Incluir JWT token en todas las peticiones
- [ ] Guardar URL retornada en el modelo correspondiente
- [ ] Implementar lazy loading de imágenes
- [ ] Agregar imagen placeholder mientras carga
- [ ] Implementar eliminación de imágenes antiguas (opcional)

---

## 🔐 Seguridad

1. **Siempre incluir JWT Token:**
   ```
   Authorization: Bearer {token}
   ```

2. **Validar en el frontend ANTES de enviar:**
   - Tipo de archivo (JPEG, PNG, WebP)
   - Tamaño de archivo
   - Dimensiones (opcional)

3. **No confiar solo en validación frontend:**
   - El backend también valida todo

4. **Limpiar URLs antiguas:**
   - Cuando actualizas una imagen, considera eliminar la antigua

---

## 📱 Ejemplo Completo de Flujo

### 1. Usuario selecciona imagen
```typescript
onFileSelected(event) {
  const file = event.target.files[0];
  // Validar y mostrar preview
}
```

### 2. Subir imagen
```typescript
this.uploadService.uploadAvatar(file).subscribe(response => {
  const imageUrl = response.url;
  // Guardar URL
});
```

### 3. Actualizar perfil con nueva URL
```typescript
this.authService.updateProfile({
  nombre: 'Juan',
  photoUrl: imageUrl
}).subscribe();
```

### 4. Mostrar imagen en UI
```html
<img [src]="user.photoUrl" 
     alt="Avatar"
     onerror="this.src='assets/default-avatar.png'">
```

---

## 🎯 URLs de Acceso Directo

Las imágenes subidas son accesibles directamente desde:

- **Avatares:** `http://localhost:3000/uploads/avatars/{filename}`
- **Portadas:** `http://localhost:3000/uploads/portadas/{filename}`
- **Posts:** `http://localhost:3000/uploads/posts/{filename}`

Estas URLs pueden usarse directamente en etiquetas `<img>` sin autenticación adicional.

---

## 📞 Soporte

Si tienes problemas:
1. Verifica que el servidor esté corriendo en `http://localhost:3000`
2. Asegúrate de tener un token JWT válido
3. Verifica que el archivo cumpla con las restricciones
4. Revisa la consola del navegador para errores específicos
