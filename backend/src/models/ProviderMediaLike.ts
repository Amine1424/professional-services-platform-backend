import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import ProviderMedia from './ProviderMedia';

@Entity('provider_media_likes')
@Unique(['mediaId', 'userId'])
export class ProviderMediaLike {
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

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

export default ProviderMediaLike;