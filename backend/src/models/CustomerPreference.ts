import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

export enum CustomerPlan {
  FREE = 'free',
  PREMIUM = 'premium',
}

@Entity('customer_preferences')
@Unique(['userId'])
export class CustomerPreference {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ type: 'simple-array', nullable: true })
  interests!: string[] | null;

  @Column({
    name: 'selected_plan',
    type: 'enum',
    enum: CustomerPlan,
    default: CustomerPlan.FREE,
  })
  selectedPlan!: CustomerPlan;

  @Column({ name: 'preferred_region', type: 'varchar', length: 120, nullable: true })
  preferredRegion!: string | null;

  @Column({ name: 'preferred_wilaya', type: 'varchar', length: 120, nullable: true })
  preferredWilaya!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

export default CustomerPreference;