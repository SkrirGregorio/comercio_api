import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Empresa } from '../../empresas/entities/empresa.entity';

@Entity('servicios')
export class Servicio {
  @PrimaryGeneratedColumn({ name: 'id_servicio' })
  id: number;

  @Column({
    type: 'varchar',
    length: 100,
    unique: true,
  })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @ManyToMany(() => Empresa, (empresa) => empresa.servicios)
  empresas: Empresa[];
}
