import { listReservations, createReservation } from '../reservations/reservations.service.js';
import { Customer } from '../../models/index.js';

// Real tool execution linked to services
export async function executeTool(name: string, args: any) {
    console.log(`[Tool Service] Executing ${name} with args:`, args);

    try {
        if (name === 'checkAvailability') {
            // Logic: check reservations for that date/time
            // Default restaurant ID for now (MVP)
            // Ideally passed in context, but let's find one or use a hardcoded one if needed
            // Actually, listReservations needs a restaurantId.
            // We'll fetch the first Restaurant again
            const { Restaurant } = await import('../../models/index.js');
            const restaurant = await Restaurant.findOne();
            if (!restaurant) return { error: 'No restaurant configured' };

            const { date, time, partySize } = args;
            const reservations = await listReservations(restaurant._id.toString(), { date });

            // Simple heuristic: check if any existing reservation at that time
            // In a real system, we'd check tables capacity vs reservations
            const conflict = reservations.some((res: any) => res.time === time);

            if (conflict) {
                // Very basic capacity check
                // Check finding next available slot?
                return { available: false, message: 'Time slot is taken.' };
            }

            return { available: true, message: 'Table is available.' };
        }

        if (name === 'createReservation') {
            const { Restaurant } = await import('../../models/index.js');
            const restaurant = await Restaurant.findOne();
            if (!restaurant) return { error: 'No restaurant configured' };

            // Ensure customer exists or update
            // Logic handled in service, but we might want to update phone

            const reservation = await createReservation(restaurant._id.toString(), {
                ...args,
                guestEmail: args.guestEmail || undefined, // optional
                occasion: args.specialRequests, // mapping
            });

            return {
                success: true,
                confirmationCode: reservation.confirmationCode,
                id: reservation._id,
                message: 'Reservation created successfully.'
            };
        }

        return { error: `Unknown tool: ${name}` };
    } catch (error: any) {
        console.error('Tool execution error:', error);
        return { error: error.message || 'Internal tool error' };
    }
}
