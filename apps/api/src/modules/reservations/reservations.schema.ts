import { z } from 'zod';

// Zod schemas for reservation validation
export const createReservationSchema = z.object({
    date: z.string().datetime(),
    time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time (HH:MM)'),
    partySize: z.number().int().min(1).max(50),
    guestName: z.string().min(1, 'Guest name is required'),
    guestPhone: z.string().min(1, 'Phone is required'),
    guestEmail: z.string().email().optional(),
    occasion: z.string().optional(),
    specialRequests: z.string().optional(),
    dietaryNotes: z.string().optional(),
    tableId: z.string().optional(),
});

export const updateReservationSchema = createReservationSchema.partial().extend({
    status: z.enum([
        'PENDING', 'CONFIRMED', 'REMINDED', 'SEATED',
        'COMPLETED', 'CANCELLED', 'NO_SHOW', 'WAITLISTED'
    ]).optional(),
    cancelReason: z.string().optional(),
});

export const listReservationsQuerySchema = z.object({
    date: z.string().optional(),
    status: z.string().optional(),
});

export type CreateReservationInput = z.infer<typeof createReservationSchema>;
export type UpdateReservationInput = z.infer<typeof updateReservationSchema>;
