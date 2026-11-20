import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Empresa } from '../../empresas/entities/empresa.entity';
import { Resena } from '../../resenas/entities/resena.entity';
import { Exclude, Expose } from 'class-transformer';

export enum Role {
  ADMIN = 'admin',
  CONSUMIDOR = 'consumidor',
  PROPIETARIO = 'propietario',
}

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  nombre: string;

  // Solo se serializa en respuestas privadas (perfil propio / panel de admin),
  // nunca en endpoints públicos como el listado de empresas o reseñas.
  @Expose({ groups: ['private'] })
  @Column({ length: 100 })
  @Unique(['email'])
  email: string;

  @Exclude()
  @Column({ length: 100 })
  password: string;

  @Column({ type: 'enum', enum: Role, default: Role.CONSUMIDOR })
  role: Role;

  @Column({ length: 500, nullable: true })
  photoUrl: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Exclude()
  @Column({ length: 500, nullable: true })
  google_id: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @OneToMany(() => Empresa, (empresa) => empresa.propietario)
  empresas: Empresa[];

  @OneToMany(() => Resena, (resena) => resena.usuario)
  resenas: Resena[];
}
