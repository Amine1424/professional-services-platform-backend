import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import User from './User';
import ServiceProvider from './ServiceProvider';
import Service from './Service';
import Conversation from './Conversation';

export enum ServiceRequestStatus {
  NEW = 'new',
  REVIEWED = 'reviewed',
  QUOTED = 'quoted',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('service_requests')
export class ServiceRequest {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'customer_user_id', type: 'uuid' })
  customerUserId!: string;

  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'customer_user_id' })
  customer!: User;

  @Column({ name: 'provider_id', type: 'uuid' })
  providerId!: string;

  @ManyToOne(() => ServiceProvider, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'provider_id' })
  provider!: ServiceProvider;

  @Column({ name: 'service_id', type: 'uuid', nullable: true })
  serviceId!: string | null;

  @ManyToOne(() => Service, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'service_id' })
  service!: Service | null;

  @Column({ name: 'conversation_id', type: 'uuid', nullable: true })
  conversationId!: string | null;

  @ManyToOne(() => Conversation, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'conversation_id' })
  conversation!: Conversation | null;

  @Column({ type: 'varchar', length: 180, nullable: true })
  subject!: string | null;

  @Column({ type: 'text' })
  description!: string;

  @Column({ name: 'budget_min', type: 'numeric', precision: 12, scale: 2, nullable: true })
  budgetMin!: string | null;

  @Column({ name: 'budget_max', type: 'numeric', precision: 12, scale: 2, nullable: true })
  budgetMax!: string | null;

  @Column({ name: 'quoted_price', type: 'numeric', precision: 12, scale: 2, nullable: true })
  quotedPrice!: string | null;

  @Column({ name: 'currency_code', type: 'varchar', length: 10, default: 'DZD' })
  currencyCode!: string;

  @Column({ name: 'provider_response', type: 'text', nullable: true })
  providerResponse!: string | null;

  @Column({ name: 'customer_note', type: 'text', nullable: true })
  customerNote!: string | null;

  @Column({ name: 'preferred_date', type: 'timestamp', nullable: true })
  preferredDate!: Date | null;

  @Column({
    name: 'status',
    type: 'enum',
    enum: ServiceRequestStatus,
    default: ServiceRequestStatus.NEW,
  })
  status!: ServiceRequestStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

export default ServiceRequest;