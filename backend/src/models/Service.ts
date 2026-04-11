import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ServiceProvider } from './ServiceProvider';
import { Category } from './Category';

export enum ServiceStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  PAUSED = 'paused',
}

export enum ServiceDeliveryMode {
  ONLINE = 'online',
  ON_SITE = 'on_site',
  HYBRID = 'hybrid',
}

@Entity('services')
export class Service {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'provider_id', type: 'uuid' })
  providerId!: string;

  @ManyToOne(() => ServiceProvider, (provider) => provider.services, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'provider_id' })
  provider!: ServiceProvider;

  @Column({ name: 'category_id', type: 'uuid', nullable: true })
  categoryId!: string | null;

  @ManyToOne(() => Category, (category) => category.services, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'category_id' })
  category!: Category | null;

  @Column({ type: 'varchar', length: 180 })
  name!: string;

  @Column({ type: 'varchar', length: 220, unique: true })
  slug!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  price!: string | null;

  @Column({ name: 'currency_code', type: 'varchar', length: 10, default: 'DZD' })
  currencyCode!: string;

  @Column({
    type: 'enum',
    enum: ServiceStatus,
    default: ServiceStatus.DRAFT,
  })
  status!: ServiceStatus;

  @Column({
    name: 'delivery_mode',
    type: 'enum',
    enum: ServiceDeliveryMode,
    default: ServiceDeliveryMode.ON_SITE,
  })
  deliveryMode!: ServiceDeliveryMode;

  @Column({ name: 'response_time_hours', type: 'int', default: 24 })
  responseTimeHours!: number;

  @Column({ name: 'is_featured', type: 'boolean', default: false })
  isFeatured!: boolean;

  @Column({ name: 'show_promo_badge', type: 'boolean', default: false })
  showPromoBadge!: boolean;

  @Column({ name: 'promo_badge_text', type: 'varchar', length: 80, nullable: true })
  promoBadgeText!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

export default Service;