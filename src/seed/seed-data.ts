import { Role } from '../usuarios/entities/usuario.entity';

/**
 * Datos de prueba para desarrollo y demostración.
 * Todas las cuentas usan la contraseña de SEED_PASSWORD (por defecto: DEFAULT_SEED_PASSWORD).
 */
export const DEFAULT_SEED_PASSWORD = 'Comercio2026!';

export interface SeedUsuario {
  nombre: string;
  email: string;
  role: Role;
}

export const USUARIOS: SeedUsuario[] = [
  {
    nombre: 'Administrador',
    email: 'admin@comerciolocal.test',
    role: Role.ADMIN,
  },
  // Propietarios (uno por empresa)
  {
    nombre: 'Carlos Méndez',
    email: 'carlos@tecnocomputadoras.test',
    role: Role.PROPIETARIO,
  },
  {
    nombre: 'Ana Linares',
    email: 'ana@compulinares.test',
    role: Role.PROPIETARIO,
  },
  { nombre: 'Luis Pérez', email: 'luis@tendapc.test', role: Role.PROPIETARIO },
  {
    nombre: 'Gregorio López',
    email: 'gregorio@internetgregory.test',
    role: Role.PROPIETARIO,
  },
  // Consumidores
  {
    nombre: 'María García',
    email: 'maria@cliente.test',
    role: Role.CONSUMIDOR,
  },
  {
    nombre: 'José Hernández',
    email: 'jose@cliente.test',
    role: Role.CONSUMIDOR,
  },
  {
    nombre: 'Sofía Ramírez',
    email: 'sofia@cliente.test',
    role: Role.CONSUMIDOR,
  },
];

export const SERVICIOS: { nombre: string; descripcion: string }[] = [
  {
    nombre: 'Reparación de computadoras',
    descripcion:
      'Diagnóstico y reparación de computadoras de escritorio y laptops.',
  },
  {
    nombre: 'Mantenimiento preventivo',
    descripcion:
      'Limpieza interna, cambio de pasta térmica y optimización del sistema.',
  },
  {
    nombre: 'Venta de equipo de cómputo',
    descripcion: 'Computadoras de escritorio, laptops y monitores nuevos.',
  },
  {
    nombre: 'Accesorios y repuestos',
    descripcion: 'Teclados, mouse, cargadores, memorias, discos y más.',
  },
  {
    nombre: 'Ensamble de computadoras',
    descripcion: 'Armado de equipos a la medida para oficina o gaming.',
  },
  {
    nombre: 'Instalación de software',
    descripcion: 'Sistemas operativos, antivirus y programas de oficina.',
  },
  {
    nombre: 'Recuperación de datos',
    descripcion: 'Recuperación de información de discos dañados o borrados.',
  },
  {
    nombre: 'Instalación de redes',
    descripcion: 'Cableado estructurado y configuración de redes WiFi.',
  },
  {
    nombre: 'Soporte técnico a domicilio',
    descripcion: 'Atención técnica en tu casa u oficina.',
  },
  {
    nombre: 'Internet residencial',
    descripcion: 'Planes de internet por fibra o inalámbrico para el hogar.',
  },
  {
    nombre: 'Internet empresarial',
    descripcion: 'Enlaces dedicados y planes para negocios.',
  },
  {
    nombre: 'Impresiones y fotocopias',
    descripcion: 'Impresión a color y blanco y negro, escaneo y copias.',
  },
  {
    nombre: 'Renta de computadoras',
    descripcion: 'Uso de computadoras con internet por hora.',
  },
  {
    nombre: 'Cámaras de seguridad',
    descripcion: 'Venta e instalación de sistemas de videovigilancia.',
  },
];

export interface SeedEmpresa {
  nombre: string;
  propietarioEmail: string;
  descripcion: string;
  direccion: string;
  telefono: string;
  email: string;
  horario: string;
  latitud: number;
  longitud: number;
  webSite?: string;
  servicios: string[];
  posts: { titulo: string; contenido: string }[];
}

// Coordenadas alrededor del centro de Jutiapa (14.2917, -89.8958)
export const EMPRESAS: SeedEmpresa[] = [
  {
    nombre: 'TecnoComputadoras',
    propietarioEmail: 'carlos@tecnocomputadoras.test',
    descripcion:
      'Venta y reparación de computadoras con más de 10 años de experiencia en Jutiapa.',
    direccion: '3a Calle 4-25, Zona 1, Jutiapa',
    telefono: '+502 7844-1001',
    email: 'contacto@tecnocomputadoras.test',
    horario: 'Lun-Sáb 8:00 AM - 6:00 PM',
    latitud: 14.29245,
    longitud: -89.89512,
    servicios: [
      'Reparación de computadoras',
      'Mantenimiento preventivo',
      'Venta de equipo de cómputo',
      'Accesorios y repuestos',
      'Recuperación de datos',
    ],
    posts: [
      {
        titulo: 'Mantenimiento preventivo con 20% de descuento',
        contenido:
          'Durante este mes, lleva tu computadora para mantenimiento preventivo y obtén 20% de descuento.',
      },
      {
        titulo: 'Nuevas laptops disponibles',
        contenido:
          'Ya tenemos disponibles laptops para estudiantes y oficina. ¡Visítanos!',
      },
    ],
  },
  {
    nombre: 'CompuLinares',
    propietarioEmail: 'ana@compulinares.test',
    descripcion:
      'Soluciones tecnológicas para el hogar y la oficina: ensamble, software y soporte.',
    direccion: '5a Avenida 2-40, Zona 2, Jutiapa',
    telefono: '+502 7844-2002',
    email: 'ventas@compulinares.test',
    horario: 'Lun-Vie 9:00 AM - 6:00 PM',
    latitud: 14.28968,
    longitud: -89.89231,
    servicios: [
      'Ensamble de computadoras',
      'Instalación de software',
      'Soporte técnico a domicilio',
      'Accesorios y repuestos',
    ],
    posts: [
      {
        titulo: 'Armamos tu PC gamer',
        contenido:
          'Cotiza tu computadora a la medida con los mejores componentes del mercado.',
      },
    ],
  },
  {
    nombre: 'Tenda PC',
    propietarioEmail: 'luis@tendapc.test',
    descripcion:
      'Tienda de computadoras, impresoras, accesorios y sistemas de seguridad.',
    direccion: 'Calzada Saturnino Lemus 8-15, Zona 3, Jutiapa',
    telefono: '+502 7844-3003',
    email: 'info@tendapc.test',
    horario: 'Lun-Sáb 9:00 AM - 7:00 PM',
    latitud: 14.29502,
    longitud: -89.89837,
    servicios: [
      'Venta de equipo de cómputo',
      'Accesorios y repuestos',
      'Cámaras de seguridad',
      'Instalación de redes',
    ],
    posts: [
      {
        titulo: 'Kits de cámaras de seguridad',
        contenido:
          'Protege tu hogar o negocio con nuestros kits de 4 cámaras con instalación incluida.',
      },
    ],
  },
  {
    nombre: 'Internet Gregory',
    propietarioEmail: 'gregorio@internetgregory.test',
    descripcion:
      'Café internet y proveedor de internet residencial y empresarial en Jutiapa.',
    direccion: '1a Calle 1-10, Zona 1, frente al Parque Central, Jutiapa',
    telefono: '+502 7844-4004',
    email: 'soporte@internetgregory.test',
    horario: 'Todos los días 8:00 AM - 9:00 PM',
    latitud: 14.29113,
    longitud: -89.89601,
    servicios: [
      'Internet residencial',
      'Internet empresarial',
      'Renta de computadoras',
      'Impresiones y fotocopias',
      'Instalación de redes',
    ],
    posts: [
      {
        titulo: 'Nuevos planes de internet residencial',
        contenido:
          'Planes desde 25 Mbps con instalación gratis en el casco urbano de Jutiapa.',
      },
      {
        titulo: 'Impresiones a color',
        contenido: 'Imprime tus tareas y documentos a color al mejor precio.',
      },
    ],
  },
];

export const RESENAS: {
  usuarioEmail: string;
  empresa: string;
  calificacion: number;
  comentario: string;
}[] = [
  {
    usuarioEmail: 'maria@cliente.test',
    empresa: 'TecnoComputadoras',
    calificacion: 5,
    comentario: 'Repararon mi laptop en un día. Excelente servicio.',
  },
  {
    usuarioEmail: 'jose@cliente.test',
    empresa: 'TecnoComputadoras',
    calificacion: 4,
    comentario: 'Buenos precios y atención amable.',
  },
  {
    usuarioEmail: 'sofia@cliente.test',
    empresa: 'CompuLinares',
    calificacion: 5,
    comentario: 'Me armaron una PC a la medida, muy recomendados.',
  },
  {
    usuarioEmail: 'maria@cliente.test',
    empresa: 'Tenda PC',
    calificacion: 4,
    comentario: 'Buena variedad de accesorios.',
  },
  {
    usuarioEmail: 'jose@cliente.test',
    empresa: 'Internet Gregory',
    calificacion: 5,
    comentario: 'El internet residencial funciona muy bien.',
  },
  {
    usuarioEmail: 'sofia@cliente.test',
    empresa: 'Internet Gregory',
    calificacion: 3,
    comentario: 'Buen servicio, aunque a veces hay que esperar turno.',
  },
];
