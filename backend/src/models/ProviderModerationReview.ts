import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import ServiceProvider from './ServiceProvider';
import User from './User';

export enum ModerationDecision {
  APPROVED = 'approved',
  REJECTED = 'rejected',
  REQUEST_INFO = 'request_info',
  SUSPENDED = 'suspended',
}

@Entity('provider_moderation_reviews')
class ProviderModerationReview {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'provider_id', type: 'uuid' })
  providerId!: string;

  @ManyToOne(() => ServiceProvider, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'provider_id' })
  provider!: ServiceProvider;

  @Column({ name: 'reviewer_user_id', type: 'uuid' })
  reviewerUserId!: string;

  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'reviewer_user_id' })
  reviewer!: User;

  @Column({
    type: 'enum',
    enum: ModerationDecision,
  })
  decision!: ModerationDecision;

  @Column({ type: 'text', nullable: true })
  note!: string | null;

  @Column({ name: 'checklist_json', type: 'simple-json', nullable: true })
  checklistJson!: Record<string, boolean> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

export default ProviderModerationReview;