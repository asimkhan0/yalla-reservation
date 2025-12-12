import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
    conversation: mongoose.Types.ObjectId;
    sender: 'CUSTOMER' | 'BOT' | 'AGENT';
    content: string;
    direction: 'INBOUND' | 'OUTBOUND';
    whatsappMsgId?: string;
    status: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
    {
        conversation: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
        sender: { type: String, enum: ['CUSTOMER', 'BOT', 'AGENT'], required: true },
        content: { type: String, required: true },
        direction: { type: String, enum: ['INBOUND', 'OUTBOUND'], required: true },
        whatsappMsgId: String,
        status: { type: String, enum: ['SENT', 'DELIVERED', 'READ', 'FAILED'], default: 'SENT' },
        metadata: Schema.Types.Mixed,
    },
    { timestamps: true }
);

messageSchema.index({ conversation: 1, createdAt: 1 });

export const Message = mongoose.models.Message || mongoose.model<IMessage>('Message', messageSchema);
