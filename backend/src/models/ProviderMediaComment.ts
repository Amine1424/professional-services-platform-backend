import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import ProviderMedia from './ProviderMedia';

@Entity('provider_media_comments')
export class ProviderMediaComment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'media_id', type: 'uuid' })
  mediaId!: string;

  @ManyToOne(() => ProviderMedia, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'media_id' })
  media!: ProviderMedia;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'author_name', type: 'varchar', length: 180 })
  authorName!: string;

  @Column({ type: 'text' })
  body!: string;

  @Column({ name: 'is_visible', type: 'boolean', default: true })
  isVisible!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

export default ProviderMediaComment;