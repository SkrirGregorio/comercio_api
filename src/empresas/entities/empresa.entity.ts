import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { Servicio } from '../../servicios/entities/servicio.entity';
import { Resena } from '../../resenas/entities/resena.entity';
import { Post } from '../../posts/entities/post.entity';
import { IsEmail } from 'class-validator';

@Entity('empresas')
export class Empresa {
  @PrimaryGeneratedColumn({ name: 'id_empresa' })
  id: number;

  @Column({ name: 'nombre_empresa', type: 'varchar', length: 150 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ type: 'varchar', length: 255 })
  direccion: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  telefono: string;

  @Column({ type: 'decimal', precision: 10, scale: 8 })
  latitud: number;

  @Column({ type: 'decimal', precision: 11, scale: 8 })
  longitud: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  horario: string;

  @Column({ name: 'url_avatar', type: 'varchar', length: 255, nullable: true })
  urlAvatar: string;

  @Column({ name: 'url_portada', type: 'varchar', length: 255, nullable: true })
  urlPortada: string;

  @Column({ name: 'web_site', type: 'varchar', length: 255, nullable: true })
  webSite: string;

  @CreateDateColumn({ name: 'fecha_registro', type: 'timestamp' })
  fechaRegistro: Date;

  @ManyToOne(() => Usuario, (usuario) => usuario.empresas, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_propietario' })
  propietario: Usuario;

  @OneToMany(() => Resena, (resena) => resena.empresa)
  resenas: Resena[];

  @Column({ type: 'varchar', length: 100, unique: true, nullable: true })
  @IsEmail()
  email: string;

  @OneToMany(() => Post, (post) => post.empresa)
  posts: Post[];

  @ManyToMany(() => Servicio, (servicio) => servicio.empresas)
  @JoinTable({
    name: 'empresa_servicios',
    joinColumn: { name: 'id_empresa' },
    inverseJoinColumn: { name: 'id_servicio' },
  })
  servicios: Servicio[];
}
