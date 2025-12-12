import mongoose, { Schema, Document } from 'mongoose';

// ==================== RESERVATION ====================
export interface IReservation extends Document {
    confirmationCode: string;
    date: Date;
    time: string;
    partySize: number;
    duration: number;
    status: 'PENDING' | 'CONFIRMED' | 'REMINDED' | 'SEATED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' | 'WAITLISTED';
    guestName: string;
    guestPhone: string;
    guestEmail?: string;
    occasion?: string;
    specialRequests?: string;
    dietaryNotes?: string;
    source: 'WHATSAPP' | 'DASHBOARD' | 'PHONE' | 'WALKIN' | 'WEBSITE';
    confirmedAt?: Date;
    seatedAt?: Date;
    completedAt?: Date;
    cancelledAt?: Date;
    cancelReason?: string;
    restaurant: mongoose.Types.ObjectId;
    customer?: mongoose.Types.ObjectId;
    table?: mongoose.Types.ObjectId;
    conversation?: mongoose.Types.ObjectId;
    reminders: Array<{
        type: 'CONFIRMATION_REQUEST' | 'REMINDER_24H' | 'REMINDER_2H' | 'POST_VISIT_FEEDBACK';
        scheduledFor: Date;
        sentAt?: Date;
    }>;
    createdAt: Date;
    updatedAt: Date;
}

const reservationSchema = new Schema<IReservation>(
    {
        confirmationCode: { type: String, required: true, unique: true },
        date: { type: Date, required: true },
        time: { type: String, required: true },
        partySize: { type: Number, required: true },
        duration: { type: Number, required: true, default: 90 },
        status: {
            type: String,
            enum: ['PENDING', 'CONFIRMED', 'REMINDED', 'SEATED', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'WAITLISTED'],
            default: 'PENDING',
        },
        guestName: { type: String, required: true },
        guestPhone: { type: String, required: true },
        guestEmail: String,
        occasion: String,
        specialRequests: String,
        dietaryNotes: String,
        source: {
            type: String,
            enum: ['WHATSAPP', 'DASHBOARD', 'PHONE', 'WALKIN', 'WEBSITE'],
            default: 'WHATSAPP',
        },
        confirmedAt: Date,
        seatedAt: Date,
        completedAt: Date,
        cancelledAt: Date,
        cancelReason: String,
        restaurant: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
        customer: { type: Schema.Types.ObjectId, ref: 'Customer' },
        table: { type: Schema.Types.ObjectId, ref: 'Table' },
        conversation: { type: Schema.Types.ObjectId, ref: 'Conversation' },
        reminders: [
            {
                type: { type: String, enum: ['CONFIRMATION_REQUEST', 'REMINDER_24H', 'REMINDER_2H', 'POST_VISIT_FEEDBACK'] },
                scheduledFor: Date,
                sentAt: Date,
            },
        ],
    },
    { timestamps: true }
);

reservationSchema.index({ restaurant: 1, date: 1 });
reservationSchema.index({ customer: 1 });
reservationSchema.index({ status: 1 });
reservationSchema.index({ confirmationCode: 1 });

// Generate confirmation code before saving
reservationSchema.pre('save', function (next) {
    if (!this.confirmationCode) {
        this.confirmationCode = `YR${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    }
    next();
});

export const Reservation = mongoose.model<IReservation>('Reservation', reservationSchema);

// ==================== CONVERSATION ====================
export interface IConversation extends Document {
    status: 'ACTIVE' | 'BOT_HANDLING' | 'HUMAN_TAKEOVER' | 'WAITING' | 'RESOLVED' | 'ARCHIVED';
    botEnabled: boolean;
    whatsappId?: string;
    lastMessageAt: Date;
    context?: Record<string, unknown>;
    intent?: string;
    restaurant: mongoose.Types.ObjectId;
    customer: mongoose.Types.ObjectId;
    assignedTo?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const conversationSchema = new Schema<IConversation>(
    {
        status: {
            type: String,
            enum: ['ACTIVE', 'BOT_HANDLING', 'HUMAN_TAKEOVER', 'WAITING', 'RESOLVED', 'ARCHIVED'],
            default: 'ACTIVE',
        },
        botEnabled: { type: Boolean, default: true },
        whatsappId: { type: String, unique: true, sparse: true },
        lastMessageAt: { type: Date, default: Date.now },
        context: Schema.Types.Mixed,
        intent: String,
        restaurant: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
        customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
        assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true }
);

conversationSchema.index({ restaurant: 1 });
conversationSchema.index({ customer: 1 });
conversationSchema.index({ status: 1 });
conversationSchema.index({ lastMessageAt: -1 });

export const Conversation = mongoose.model<IConversation>('Conversation', conversationSchema);

// ==================== MESSAGE ====================
export interface IMessage extends Document {
    content: string;
    contentType: 'TEXT' | 'IMAGE' | 'DOCUMENT' | 'LOCATION' | 'QUICK_REPLY' | 'TEMPLATE';
    direction: 'INBOUND' | 'OUTBOUND';
    sender: 'CUSTOMER' | 'BOT' | 'STAFF';
    whatsappMsgId?: string;
    status: 'QUEUED' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
    aiConfidence?: number;
    aiIntent?: string;
    mediaUrl?: string;
    mediaType?: string;
    conversation: mongoose.Types.ObjectId;
    user?: mongoose.Types.ObjectId;
    createdAt: Date;
}

const messageSchema = new Schema<IMessage>(
    {
        content: { type: String, required: true },
        contentType: {
            type: String,
            enum: ['TEXT', 'IMAGE', 'DOCUMENT', 'LOCATION', 'QUICK_REPLY', 'TEMPLATE'],
            default: 'TEXT',
        },
        direction: { type: String, enum: ['INBOUND', 'OUTBOUND'], required: true },
        sender: { type: String, enum: ['CUSTOMER', 'BOT', 'STAFF'], required: true },
        whatsappMsgId: { type: String, unique: true, sparse: true },
        status: { type: String, enum: ['QUEUED', 'SENT', 'DELIVERED', 'READ', 'FAILED'], default: 'SENT' },
        aiConfidence: Number,
        aiIntent: String,
        mediaUrl: String,
        mediaType: String,
        conversation: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
        user: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true }
);

messageSchema.index({ conversation: 1 });
messageSchema.index({ createdAt: 1 });

export const Message = mongoose.model<IMessage>('Message', messageSchema);
