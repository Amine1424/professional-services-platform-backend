import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ServiceProvider } from './ServiceProvider';

export enum ProviderPlan {
  BASIC = 'basic',
  PRO = 'pro',
  BUSINESS = 'business',
}

@Entity('provider_preferences')
export class ProviderPreference {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'provider_id', type: 'uuid', unique: true })
  providerId!: string;

  @OneToOne(() => ServiceProvider, (provider) => provider.preference, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'provider_id' })
  provider!: ServiceProvider;

  @Column({
    name: 'selected_plan',
    type: 'enum',
    enum: ProviderPlan,
    default: ProviderPlan.BASIC,
  })
  selectedPlan!: ProviderPlan;

  @Column({ name: 'featured_on_homepage', type: 'boolean', default: false })
  featuredOnHomepage!: boolean;

  @Column({ name: 'profile_badge_text', type: 'varchar', length: 80, nullable: true })
  profileBadgeText!: string | null;

  @Column({ name: 'auto_reply_enabled', type: 'boolean', default: false })
  autoReplyEnabled!: boolean;

  @Column({
    name: 'auto_reply_tone',
    type: 'varchar',
    length: 30,
    default: 'professional',
  })
  autoReplyTone!: string;

  @Column({
    name: 'auto_reply_signature',
    type: 'varchar',
    length: 160,
    nullable: true,
  })
  autoReplySignature!: string | null;

  @Column({ name: 'privacy_show_email', type: 'boolean', default: false })
  privacyShowEmail!: boolean;

  @Column({ name: 'privacy_show_phone', type: 'boolean', default: true })
  privacyShowPhone!: boolean;

  @Column({ name: 'privacy_show_address', type: 'boolean', default: false })
  privacyShowAddress!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

export default ProviderPreference;