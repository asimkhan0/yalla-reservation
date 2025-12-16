import mongoose, { Schema, Document } from 'mongoose';

export interface IConversation extends Document {
    customer: mongoose.Types.ObjectId;
    restaurant: mongoose.Types.ObjectId;
    status: 'ACTIVE' | 'RESOLVED' | 'ARCHIVED';
    source: 'WHATSAPP' | 'WEB' | 'SMS';
    assignedTo: 'BOT' | 'AGENT';
    context: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

const conversationSchema = new Schema<IConversation>(
    {
        customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
        restaurant: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
        status: { type: String, enum: ['ACTIVE', 'RESOLVED', 'ARCHIVED'], default: 'ACTIVE' },
        source: { type: String, enum: ['WHATSAPP', 'WEB', 'SMS'], default: 'WHATSAPP' },
        assignedTo: { type: String, enum: ['BOT', 'AGENT'], default: 'BOT' },
        context: { type: Map, of: Schema.Types.Mixed, default: {} },
    },
    { timestamps: true }
);

conversationSchema.index({ customer: 1, status: 1 });
conversationSchema.index({ restaurant: 1 });

export const Conversation = mongoose.models.Conversation || mongoose.model<IConversation>('Conversation', conversationSchema);
