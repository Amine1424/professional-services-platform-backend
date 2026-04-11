import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

@Entity('favorite_providers')
@Unique(['userId', 'providerId'])
export class FavoriteProvider {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'provider_id', type: 'uuid' })
  providerId!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

export default FavoriteProvider;