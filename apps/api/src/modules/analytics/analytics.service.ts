import { Reservation } from '../../models/reservation';
import { Conversation } from '../../models/conversation';
import mongoose from 'mongoose';
import { startOfDay, subDays, startOfHour, endOfDay } from 'date-fns';

export const getDashboardStats = async (restaurantId: string, days = 30) => {
    const startDate = subDays(startOfDay(new Date()), days);
    const objectIdRestaurant = new mongoose.Types.ObjectId(restaurantId);

    // 1. KPI Cards Data
    const totalReservations = await Reservation.countDocuments({
        restaurant: objectIdRestaurant,
        createdAt: { $gte: startDate },
    });

    const activeReservations = await Reservation.aggregate([
        {
            $match: {
                restaurant: objectIdRestaurant,
                createdAt: { $gte: startDate },
                status: { $in: ['CONFIRMED', 'SEATED', 'COMPLETED'] },
            },
        },
        {
            $group: {
                _id: null,
                totalCovers: { $sum: '$partySize' },
                count: { $sum: 1 },
            },
        },
    ]);

    const cancelledReservations = await Reservation.countDocuments({
        restaurant: objectIdRestaurant,
        createdAt: { $gte: startDate },
        status: { $in: ['CANCELLED', 'NO_SHOW'] },
    });

    const totalCovers = activeReservations[0]?.totalCovers || 0;
    const cancellationRate = totalReservations > 0 ? (cancelledReservations / totalReservations) * 100 : 0;

    // 2. Charts Data

    // Booking Trends (Daily)
    const bookingTrends = await Reservation.aggregate([
        {
            $match: {
                restaurant: objectIdRestaurant,
                createdAt: { $gte: startDate },
            },
        },
        {
            $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                reservations: { $sum: 1 },
                covers: { $sum: '$partySize' },
            },
        },
        { $sort: { _id: 1 } },
    ]);

    // Reservations by Source
    const reservationsBySource = await Reservation.aggregate([
        {
            $match: {
                restaurant: objectIdRestaurant,
                createdAt: { $gte: startDate },
            },
        },
        {
            $group: {
                _id: '$source',
                value: { $sum: 1 },
            },
        },
    ]);

    // Reservations by Status
    const reservationsByStatus = await Reservation.aggregate([
        {
            $match: {
                restaurant: objectIdRestaurant,
                createdAt: { $gte: startDate },
            },
        },
        {
            $group: {
                _id: '$status',
                value: { $sum: 1 },
            },
        },
    ]);

    // Popular Times (Heatmap - Hour of Day)
    // We look at the 'time' field which is a string like "19:00".
    // We simply group by that string.
    const popularTimes = await Reservation.aggregate([
        {
            $match: {
                restaurant: objectIdRestaurant,
                createdAt: { $gte: startDate },
                status: { $ne: 'CANCELLED' }, // Exclude cancelled
            },
        },
        {
            $group: {
                _id: '$time',
                value: { $sum: 1 },
            },
        },
        { $sort: { _id: 1 } },
    ]);

    return {
        kpi: {
            totalReservations,
            totalCovers,
            cancellationRate,
            activeReservations: activeReservations[0]?.count || 0,
        },
        charts: {
            bookingTrends: bookingTrends.map(item => ({ date: item._id, reservations: item.reservations, covers: item.covers })),
            reservationsBySource: reservationsBySource.map(item => ({ name: item._id || 'Unknown', value: item.value })),
            reservationsByStatus: reservationsByStatus.map(item => ({ name: item._id, value: item.value })),
            popularTimes: popularTimes.map(item => ({ time: item._id, value: item.value })),
        },
    };
};
