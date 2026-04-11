import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import Region from './Region';

@Entity('wilayas')
class Wilaya {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'region_id', type: 'uuid', nullable: true })
  regionId!: string | null;

  @ManyToOne(() => Region, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'region_id' })
  region!: Region | null;

  @Column({ type: 'varchar', length: 120, unique: true })
  name!: string;

  @Column({ type: 'varchar', length: 140, unique: true })
  slug!: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  code!: string | null;

  @Column({ name: 'display_order', type: 'int', default: 0 })
  displayOrder!: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

export default Wilaya;