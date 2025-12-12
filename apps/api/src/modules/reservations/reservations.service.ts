import { Reservation } from '../../models/reservation.js';
import { CreateReservationInput, UpdateReservationInput } from './reservations.schema.js';

// List reservations for a restaurant
export async function listReservations(
    restaurantId: string,
    options: { date?: string; status?: string } = {}
) {
    const query: Record<string, unknown> = { restaurant: restaurantId };

    if (options.date) {
        const dateStart = new Date(options.date);
        dateStart.setHours(0, 0, 0, 0);
        const dateEnd = new Date(options.date);
        dateEnd.setHours(23, 59, 59, 999);
        query.date = { $gte: dateStart, $lte: dateEnd };
    }

    if (options.status) {
        query.status = options.status;
    }

    return Reservation.find(query)
        .populate('table', 'name capacity')
        .populate('customer', 'name phone')
        .sort({ time: 1 })
        .lean();
}

// Get single reservation
export async function getReservationById(id: string, restaurantId: string) {
    const reservation = await Reservation.findOne({ _id: id, restaurant: restaurantId })
        .populate('table')
        .populate('customer')
        .lean();

    if (!reservation) {
        throw new Error('Reservation not found');
    }
    return reservation;
}

// Create new reservation
export async function createReservation(restaurantId: string, data: CreateReservationInput) {
    const reservation = new Reservation({
        ...data,
        restaurant: restaurantId,
        date: new Date(data.date),
        source: 'DASHBOARD',
        status: 'CONFIRMED',
    });

    await reservation.save();
    return reservation.toObject();
}

// Update reservation
export async function updateReservation(
    id: string,
    restaurantId: string,
    data: UpdateReservationInput
) {
    // Handle status transitions
    const updates: Record<string, unknown> = { ...data };

    if (data.status === 'CONFIRMED' && !updates.confirmedAt) {
        updates.confirmedAt = new Date();
    }
    if (data.status === 'SEATED' && !updates.seatedAt) {
        updates.seatedAt = new Date();
    }
    if (data.status === 'COMPLETED' && !updates.completedAt) {
        updates.completedAt = new Date();
    }
    if (data.status === 'CANCELLED' && !updates.cancelledAt) {
        updates.cancelledAt = new Date();
    }

    const reservation = await Reservation.findOneAndUpdate(
        { _id: id, restaurant: restaurantId },
        { $set: updates },
        { new: true }
    ).lean();

    if (!reservation) {
        throw new Error('Reservation not found');
    }
    return reservation;
}

// Delete reservation
export async function deleteReservation(id: string, restaurantId: string) {
    const result = await Reservation.deleteOne({ _id: id, restaurant: restaurantId });
    if (result.deletedCount === 0) {
        throw new Error('Reservation not found');
    }
    return { success: true };
}
