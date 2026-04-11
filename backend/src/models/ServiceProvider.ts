import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './User';
import { Category } from './Category';
import { Service } from './Service';
import { ProviderPreference } from './ProviderPreference';

export enum ProviderStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended',
}

@Entity('service_providers')
export class ServiceProvider {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid', unique: true })
  userId!: string;

  @OneToOne(() => User, (user) => user.serviceProvider, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'company_name', type: 'varchar', length: 180 })
  companyName!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'region', type: 'varchar', length: 100, nullable: true })
  region!: string | null;

  @Column({ name: 'wilaya', type: 'varchar', length: 100, nullable: true })
  wilaya!: string | null;

  @Column({ name: 'city', type: 'varchar', length: 100, nullable: true })
  city!: string | null;

  @Column({ name: 'address_line', type: 'varchar', length: 255, nullable: true })
  addressLine!: string | null;

  @Column({ name: 'avatar_url', type: 'varchar', length: 500, nullable: true })
  avatarUrl!: string | null;

  @Column({ name: 'cover_url', type: 'varchar', length: 500, nullable: true })
  coverUrl!: string | null;

  @Column({ name: 'primary_category_id', type: 'uuid', nullable: true })
  primaryCategoryId!: string | null;

  @ManyToOne(() => Category, (category) => category.providerProfiles, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'primary_category_id' })
  primaryCategory!: Category | null;

  @Column({ name: 'years_of_experience', type: 'int', default: 0 })
  yearsOfExperience!: number;

  @Column({
    name: 'average_rating',
    type: 'numeric',
    precision: 3,
    scale: 2,
    default: 0,
  })
  averageRating!: string;

  @Column({ name: 'reviews_count', type: 'int', default: 0 })
  reviewsCount!: number;

  @Column({ name: 'response_time_minutes', type: 'int', default: 0 })
  responseTimeMinutes!: number;

  @Column({ name: 'is_verified', type: 'boolean', default: false })
  isVerified!: boolean;

  @Column({
    name: 'status',
    type: 'enum',
    enum: ProviderStatus,
    default: ProviderStatus.PENDING,
  })
  status!: ProviderStatus;

  @OneToMany(() => Service, (service) => service.provider)
  services!: Service[];

  @OneToOne(() => ProviderPreference, (preference) => preference.provider)
  preference!: ProviderPreference;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

export default ServiceProvider;