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
        confirmationCode: { type: String, unique: true },
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

export const Reservation = (mongoose.models.Reservation || mongoose.model<IReservation>('Reservation', reservationSchema)) as mongoose.Model<IReservation>;

// Duplicate Conversation and Message models removed. Imported from individual files where needed.
