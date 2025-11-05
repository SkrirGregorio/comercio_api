# 🏪 API COMERCIO - Documentación Completa

![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)

API REST para una plataforma de comercio que permite a las empresas mostrar sus servicios, crear portafolios y recibir reseñas de clientes.

## 📋 Tabla de Contenidos

- [🚀 Instalación y Configuración](#-instalación-y-configuración)
- [🔐 Autenticación](#-autenticación)
- [🏢 Endpoints de Empresas](#-endpoints-de-empresas)
- [🛠️ Endpoints de Servicios](#️-endpoints-de-servicios)
- [📝 Endpoints de Posts](#-endpoints-de-posts)
- [⭐ Endpoints de Reseñas](#-endpoints-de-reseñas)
- [👥 Sistema de Roles](#-sistema-de-roles)
- [📊 Códigos de Respuesta](#-códigos-de-respuesta)
- [🗂️ Estructuras de Datos](#️-estructuras-de-datos)

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js 18+
- PostgreSQL
- npm o yarn

### Instalación
```bash
# Clonar el repositorio
git clone <tu-repositorio>
cd api-comercio

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
```

### Variables de Entorno (.env)
```env
# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_USER=tu_usuario
DB_PASS=tu_password
DB_NAME=comercio_db

# JWT
JWT_SECRET=tu_secret_super_seguro

# Puerto de la aplicación
PORT=3000
```

### Ejecutar la aplicación
```bash
# Desarrollo
npm run start:dev

# Producción
npm run start:prod
```

## 🌐 Base URL
```
http://localhost:3000
```

## 🔐 Autenticación

### Registro de Usuario
**POST** `/auth/register` 🌐 **PÚBLICO**

```json
{
  "nombre": "Juan Pérez",
  "email": "juan@email.com", 
  "password": "123456",
  "photoUrl": "http://example.com/foto.jpg", // ⚡ opcional
  "role": "consumidor" // ⚡ opcional: admin, consumidor, propietario
}
```

**Respuesta:**
```json
{
  "id": 1,
  "nombre": "Juan Pérez",
  "email": "juan@email.com",
  "role": "consumidor",
  "photoUrl": "http://example.com/foto.jpg",
  "isActive": true,
  "createdAt": "2025-11-01T10:30:00Z"
}
```

### Iniciar Sesión
**POST** `/auth/login` 🌐 **PÚBLICO**

```json
{
  "email": "juan@email.com",
  "password": "123456"
}
```

**Respuesta:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Autenticación en Headers
Para endpoints protegidos, incluir:
```http
Authorization: Bearer {tu_token_jwt}
```

## 🏢 Endpoints de Empresas

### Obtener Todas las Empresas
**GET** `/empresas` 🌐 **PÚBLICO**

**Respuesta:**
```json
[
  {
    "id": 1,
    "nombre": "Mi Empresa SA",
    "descripcion": "Una gran empresa",
    "direccion": "Calle Principal 123",
    "telefono": "555-1234",
    "latitud": 14.6349,
    "longitud": -90.5069,
    "horario": "8:00 AM - 6:00 PM",
    "urlAvatar": "http://example.com/logo.jpg",
    "urlPortada": "http://example.com/portada.jpg",
    "fechaRegistro": "2025-11-01T10:30:00Z",
    "propietario": {
      "id": 2,
      "nombre": "Juan Pérez",
      "email": "juan@email.com",
      "role": "propietario"
    }
  }
]
```

### Obtener Empresa Específica
**GET** `/empresas/:id` 🌐 **PÚBLICO**

### Crear Nueva Empresa
**POST** `/empresas` 🔒 **AUTENTICADO** (Propietarios/Admins)

```json
{
  "nombre": "Mi Empresa SA",
  "descripcion": "Descripción de la empresa", // ⚡ opcional
  "direccion": "Calle Principal 123",
  "telefono": "555-1234", // ⚡ opcional
  "latitud": 14.6349,
  "longitud": -90.5069,
  "horario": "8:00 AM - 6:00 PM", // ⚡ opcional
  "urlAvatar": "http://example.com/logo.jpg", // ⚡ opcional
  "urlPortada": "http://example.com/portada.jpg" // ⚡ opcional
}
```

> **Nota:** El `propietarioId` se asigna automáticamente desde el token JWT.

### Actualizar Empresa
**PATCH** `/empresas/:id` 🔒 **AUTENTICADO** (Solo el propietario)

Mismos campos que POST pero todos opcionales.

### Eliminar Empresa
**DELETE** `/empresas/:id` 🔒 **AUTENTICADO** (Solo el propietario)

## 🛠️ Endpoints de Servicios

### Obtener Todos los Servicios
**GET** `/servicios` 🌐 **PÚBLICO**

### Buscar Servicios por Nombre
**GET** `/servicios/search?nombre=desarrollo` 🌐 **PÚBLICO**

### Obtener Servicio Específico
**GET** `/servicios/:id` 🌐 **PÚBLICO**

Incluye las empresas que ofrecen este servicio.

### Crear Nuevo Servicio
**POST** `/servicios` 🔒 **ADMIN ÚNICAMENTE**

```json
{
  "nombre": "Desarrollo Web",
  "descripcion": "Creación de sitios web modernos" // ⚡ opcional
}
```

### Actualizar Servicio
**PATCH** `/servicios/:id` 🔒 **ADMIN ÚNICAMENTE**

### Eliminar Servicio
**DELETE** `/servicios/:id` 🔒 **ADMIN ÚNICAMENTE**

> **Restricción:** No permite eliminar si hay empresas usando el servicio.

## 📝 Endpoints de Posts (Portafolio)

### Obtener Todos los Posts
**GET** `/posts` 🌐 **PÚBLICO**

**Respuesta:**
```json
[
  {
    "id": 1,
    "titulo": "Nuestro último proyecto",
    "contenido": "Descripción detallada del proyecto...",
    "urlImagen": "http://example.com/proyecto.jpg",
    "createdAt": "2025-11-01T10:30:00Z",
    "updatedAt": "2025-11-01T10:30:00Z",
    "empresa": {
      "id": 1,
      "nombre": "Mi Empresa SA",
      "urlAvatar": "http://example.com/logo.jpg"
    }
  }
]
```

### Obtener Post Específico
**GET** `/posts/:id` 🌐 **PÚBLICO**

Incluye información completa de la empresa y propietario.

### Crear Nuevo Post
**POST** `/posts` 🔒 **AUTENTICADO** (Solo propietario de la empresa)

```json
{
  "titulo": "Nuestro último proyecto",
  "contenido": "Descripción detallada del proyecto...",
  "urlImagen": "http://example.com/proyecto.jpg", // ⚡ opcional
  "empresaId": 1
}
```

### Actualizar Post
**PATCH** `/posts/:id` 🔒 **AUTENTICADO** (Solo el propietario de la empresa)

### Eliminar Post
**DELETE** `/posts/:id` 🔒 **AUTENTICADO** (Solo el propietario de la empresa)

## ⭐ Endpoints de Reseñas

### Obtener Todas las Reseñas
**GET** `/resenas` 🌐 **PÚBLICO**

### Obtener Reseñas por Empresa
**GET** `/resenas/empresa/:empresaId` 🌐 **PÚBLICO**

Ordenadas por fecha (más recientes primero).

**Respuesta:**
```json
[
  {
    "id": 1,
    "calificacion": 5,
    "comentario": "Excelente servicio!",
    "createdAt": "2025-11-01T10:30:00Z",
    "usuario": {
      "id": 3,
      "nombre": "María García",
      "email": "maria@email.com"
    }
  }
]
```

### Obtener Reseña Específica
**GET** `/resenas/:id` 🌐 **PÚBLICO**

### Crear Nueva Reseña
**POST** `/resenas` 🔒 **AUTENTICADO**

```json
{
  "calificacion": 5, // 🔢 1-5 obligatorio
  "comentario": "Excelente servicio!", // ⚡ opcional
  "idEmpresa": 1
}
```

**Restricciones:**
- ❌ No puedes reseñar tu propia empresa
- ❌ Solo una reseña por empresa por usuario

### Actualizar Reseña
**PATCH** `/resenas/:id` 🔒 **AUTENTICADO** (Solo el autor)

> **Nota:** No permite cambiar la empresa asociada.

### Eliminar Reseña
**DELETE** `/resenas/:id` 🔒 **AUTENTICADO** (Solo el autor)

## 👥 Sistema de Roles

| Rol | Permisos |
|-----|----------|
| **🔰 admin** | • Gestionar servicios<br>• Ver todo el contenido<br>• Crear empresas |
| **🏢 propietario** | • Crear/gestionar empresas propias<br>• Crear/gestionar posts de sus empresas<br>• Ver contenido público |
| **👤 consumidor** | • Crear reseñas<br>• Ver contenido público |

## 📊 Códigos de Respuesta

| Código | Descripción |
|--------|-------------|
| **200** | ✅ Éxito |
| **201** | ✅ Creado exitosamente |
| **400** | ❌ Error de validación en datos enviados |
| **401** | ❌ No autenticado o token inválido |
| **403** | ❌ No autorizado (falta permisos) |
| **404** | ❌ Recurso no encontrado |
| **409** | ❌ Conflicto (email duplicado, etc.) |

## 🗂️ Estructuras de Datos

### Usuario
```typescript
interface Usuario {
  id: number;
  nombre: string;
  email: string;
  role: 'admin' | 'consumidor' | 'propietario';
  photoUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Empresa
```typescript
interface Empresa {
  id: number;
  nombre: string;
  descripcion?: string;
  direccion: string;
  telefono?: string;
  latitud: number;
  longitud: number;
  horario?: string;
  urlAvatar?: string;
  urlPortada?: string;
  fechaRegistro: Date;
  propietario: Usuario;
}
```

### Post
```typescript
interface Post {
  id: number;
  titulo: string;
  contenido: string;
  urlImagen?: string;
  createdAt: Date;
  updatedAt: Date;
  empresa: Empresa;
}
```

### Reseña
```typescript
interface Resena {
  id: number;
  calificacion: number; // 1-5
  comentario?: string;
  createdAt: Date;
  updatedAt: Date;
  empresa: Empresa;
  usuario: Usuario;
}
```

### Servicio
```typescript
interface Servicio {
  id: number;
  nombre: string;
  descripcion?: string;
  empresas?: Empresa[];
}
```

## 🛡️ Validaciones

### Campos Obligatorios por Entidad

**Usuario:**
- ✅ nombre, email, password

**Empresa:**
- ✅ nombre, direccion, latitud, longitud

**Post:**
- ✅ titulo, contenido, empresaId

**Reseña:**
- ✅ calificacion (1-5), idEmpresa

**Servicio:**
- ✅ nombre (único)

## 🚀 Ejemplos de Uso con JavaScript/Fetch

### Registro y Login
```javascript
// Registro
const registro = await fetch('http://localhost:3000/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    nombre: 'Juan Pérez',
    email: 'juan@email.com',
    password: '123456',
    role: 'propietario'
  })
});

// Login
const login = await fetch('http://localhost:3000/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'juan@email.com',
    password: '123456'
  })
});
const { access_token } = await login.json();
```

### Crear Empresa
```javascript
const empresa = await fetch('http://localhost:3000/empresas', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${access_token}`
  },
  body: JSON.stringify({
    nombre: 'Mi Empresa SA',
    descripcion: 'Una gran empresa',
    direccion: 'Calle Principal 123',
    latitud: 14.6349,
    longitud: -90.5069
  })
});
```

### Obtener Empresas
```javascript
const empresas = await fetch('http://localhost:3000/empresas');
const data = await empresas.json();
```

## 📝 Notas Importantes

1. **Tokens JWT:** Expiran en 2 días. Implementa refresh tokens en producción.
2. **Datos Sensibles:** Las contraseñas y algunos campos se excluyen automáticamente de las respuestas.
3. **Relaciones:** Los endpoints incluyen datos relacionados relevantes para evitar múltiples peticiones.
4. **Seguridad:** Todos los endpoints de modificación requieren que el usuario sea el propietario del recurso.

## 🤝 Contribuir

1. Fork del repositorio
2. Crear rama feature (`git checkout -b feature/amazing-feature`)
3. Commit cambios (`git commit -m 'Add amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

---

**Desarrollado con ❤️ usando NestJS + TypeScript**