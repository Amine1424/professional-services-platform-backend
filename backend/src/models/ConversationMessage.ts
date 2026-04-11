import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import Conversation from './Conversation';
import User from './User';

@Entity('conversation_messages')
export class ConversationMessage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'conversation_id', type: 'uuid' })
  conversationId!: string;

  @ManyToOne(() => Conversation, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conversation_id' })
  conversation!: Conversation;

  @Column({ name: 'sender_user_id', type: 'uuid' })
  senderUserId!: string;

  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'sender_user_id' })
  sender!: User;

  @Column({ name: 'sender_role', type: 'varchar', length: 40 })
  senderRole!: string;

  @Column({ type: 'text' })
  body!: string;

  @Column({ name: 'is_ai_assisted', type: 'boolean', default: false })
  isAiAssisted!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

export default ConversationMessage;