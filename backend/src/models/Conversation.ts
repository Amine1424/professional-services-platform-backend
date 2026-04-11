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

export enum ConversationStatus {
  OPEN = 'open',
  ARCHIVED = 'archived',
}

@Entity('conversations')
export class Conversation {
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

  @Column({ type: 'varchar', length: 180, nullable: true })
  subject!: string | null;

  @Column({
    name: 'status',
    type: 'enum',
    enum: ConversationStatus,
    default: ConversationStatus.OPEN,
  })
  status!: ConversationStatus;

  @Column({ name: 'last_message_preview', type: 'varchar', length: 500, nullable: true })
  lastMessagePreview!: string | null;

  @Column({ name: 'last_message_at', type: 'timestamp', nullable: true })
  lastMessageAt!: Date | null;

  @Column({ name: 'last_read_customer_at', type: 'timestamp', nullable: true })
  lastReadCustomerAt!: Date | null;

  @Column({ name: 'last_read_provider_at', type: 'timestamp', nullable: true })
  lastReadProviderAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

export default Conversation;