import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import ServiceProvider from './ServiceProvider';
import Service from './Service';

export enum ProviderMediaType {
  IMAGE = 'image',
  VIDEO = 'video',
}

export enum ProviderMediaStoryAudience {
  PUBLIC = 'public',
  FAVORITES_ONLY = 'favorites_only',
}

@Entity('provider_media')
export class ProviderMedia {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

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

  @Column({
    name: 'media_type',
    type: 'enum',
    enum: ProviderMediaType,
    default: ProviderMediaType.IMAGE,
  })
  mediaType!: ProviderMediaType;

  @Column({ name: 'media_url', type: 'varchar', length: 1000 })
  mediaUrl!: string;

  @Column({ name: 'thumbnail_url', type: 'varchar', length: 1000, nullable: true })
  thumbnailUrl!: string | null;

  @Column({ type: 'varchar', length: 180 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'is_published', type: 'boolean', default: true })
  isPublished!: boolean;

  @Column({ name: 'is_featured', type: 'boolean', default: false })
  isFeatured!: boolean;

  @Column({ name: 'show_promo_badge', type: 'boolean', default: false })
  showPromoBadge!: boolean;

  @Column({ name: 'promo_badge_text', type: 'varchar', length: 80, nullable: true })
  promoBadgeText!: string | null;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder!: number;

  @Column({ name: 'likes_count', type: 'int', default: 0 })
  likesCount!: number;

  @Column({ name: 'comments_count', type: 'int', default: 0 })
  commentsCount!: number;

  @Column({ name: 'is_story', type: 'boolean', default: false })
  isStory!: boolean;

  @Column({
    name: 'story_audience',
    type: 'varchar',
    length: 40,
    default: ProviderMediaStoryAudience.PUBLIC,
  })
  storyAudience!: ProviderMediaStoryAudience;

  @Column({ name: 'story_expires_at', type: 'timestamp', nullable: true })
  storyExpiresAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

export default ProviderMedia;