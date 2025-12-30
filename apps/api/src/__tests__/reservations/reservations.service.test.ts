import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
    connectTestDb,
    disconnectTestDb,
    clearTestDb,
    createMockRestaurantData,
} from '../utils/test-helpers.js';
import {
    listReservations,
    getReservationById,
    createReservation,
    updateReservation,
    deleteReservation,
} from '../../modules/reservations/reservations.service.js';
import { Restaurant } from '../../models/index.js';
import { Reservation } from '../../models/reservation.js';
import mongoose from 'mongoose';

describe('Reservations Service', () => {
    let restaurantId: string;

    beforeAll(async () => {
        await connectTestDb();
    });

    afterAll(async () => {
        await disconnectTestDb();
    });

    beforeEach(async () => {
        await clearTestDb();
        // Create a test restaurant for all tests
        const restaurant = await Restaurant.create(createMockRestaurantData());
        restaurantId = restaurant._id.toString();
    });

    describe('listReservations', () => {
        it('should return empty array when no reservations', async () => {
            const result = await listReservations(restaurantId);
            expect(result).toEqual([]);
        });

        it('should return all reservations for a restaurant', async () => {
            // Create test reservations
            await Reservation.create({
                restaurant: restaurantId,
                date: new Date('2025-01-15'),
                time: '19:00',
                partySize: 4,
                guestName: 'John Doe',
                guestPhone: '+1234567890',
                status: 'CONFIRMED',
            });
            await Reservation.create({
                restaurant: restaurantId,
                date: new Date('2025-01-15'),
                time: '20:00',
                partySize: 2,
                guestName: 'Jane Smith',
                guestPhone: '+0987654321',
                status: 'CONFIRMED',
            });

            const result = await listReservations(restaurantId);
            expect(result).toHaveLength(2);
        });

        it('should filter by single date', async () => {
            await Reservation.create({
                restaurant: restaurantId,
                date: new Date('2025-01-15'),
                time: '19:00',
                partySize: 4,
                guestName: 'John Doe',
                guestPhone: '+1234567890',
            });
            await Reservation.create({
                restaurant: restaurantId,
                date: new Date('2025-01-16'),
                time: '19:00',
                partySize: 2,
                guestName: 'Jane Smith',
                guestPhone: '+0987654321',
            });

            const result = await listReservations(restaurantId, { date: '2025-01-15' });
            expect(result).toHaveLength(1);
            expect(result[0]?.guestName).toBe('John Doe');
        });

        it('should filter by date range', async () => {
            await Reservation.create({
                restaurant: restaurantId,
                date: new Date('2025-01-14'),
                time: '19:00',
                partySize: 4,
                guestName: 'Early',
                guestPhone: '+1111111111',
            });
            await Reservation.create({
                restaurant: restaurantId,
                date: new Date('2025-01-15'),
                time: '19:00',
                partySize: 4,
                guestName: 'Middle',
                guestPhone: '+2222222222',
            });
            await Reservation.create({
                restaurant: restaurantId,
                date: new Date('2025-01-17'),
                time: '19:00',
                partySize: 4,
                guestName: 'Late',
                guestPhone: '+3333333333',
            });

            const result = await listReservations(restaurantId, {
                startDate: '2025-01-14',
                endDate: '2025-01-15',
            });
            expect(result).toHaveLength(2);
        });

        it('should filter by status', async () => {
            await Reservation.create({
                restaurant: restaurantId,
                date: new Date('2025-01-15'),
                time: '19:00',
                partySize: 4,
                guestName: 'Confirmed Guest',
                guestPhone: '+1234567890',
                status: 'CONFIRMED',
            });
            await Reservation.create({
                restaurant: restaurantId,
                date: new Date('2025-01-15'),
                time: '20:00',
                partySize: 2,
                guestName: 'Cancelled Guest',
                guestPhone: '+0987654321',
                status: 'CANCELLED',
            });

            const result = await listReservations(restaurantId, { status: 'CONFIRMED' });
            expect(result).toHaveLength(1);
            expect(result[0]?.guestName).toBe('Confirmed Guest');
        });

        it('should filter by customerId', async () => {
            const customerId1 = new mongoose.Types.ObjectId().toString();
            const customerId2 = new mongoose.Types.ObjectId().toString();

            await Reservation.create({
                restaurant: restaurantId,
                date: new Date('2025-01-15'),
                time: '19:00',
                partySize: 4,
                guestName: 'Customer 1',
                guestPhone: '+111',
                customer: customerId1,
            });

            await Reservation.create({
                restaurant: restaurantId,
                date: new Date('2025-01-15'),
                time: '20:00',
                partySize: 2,
                guestName: 'Customer 2',
                guestPhone: '+222',
                customer: customerId2,
            });

            const result = await listReservations(restaurantId, { customerId: customerId1 });
            expect(result).toHaveLength(1);
            expect(result[0]?.guestName).toBe('Customer 1');
        });
    });

    describe('getReservationById', () => {
        it('should return a reservation by id', async () => {
            const reservation = await Reservation.create({
                restaurant: restaurantId,
                date: new Date('2025-01-15'),
                time: '19:00',
                partySize: 4,
                guestName: 'John Doe',
                guestPhone: '+1234567890',
            });

            const result = await getReservationById(reservation._id.toString(), restaurantId);
            expect(result.guestName).toBe('John Doe');
            expect(result.partySize).toBe(4);
        });

        it('should throw error for non-existent reservation', async () => {
            const fakeId = new mongoose.Types.ObjectId().toString();
            await expect(getReservationById(fakeId, restaurantId)).rejects.toThrow('Reservation not found');
        });

        it('should throw error for wrong restaurant', async () => {
            const otherRestaurant = await Restaurant.create(createMockRestaurantData({
                slug: 'other-restaurant',
                email: 'other@restaurant.com',
            }));

            const reservation = await Reservation.create({
                restaurant: restaurantId,
                date: new Date('2025-01-15'),
                time: '19:00',
                partySize: 4,
                guestName: 'John Doe',
                guestPhone: '+1234567890',
            });

            await expect(
                getReservationById(reservation._id.toString(), otherRestaurant._id.toString())
            ).rejects.toThrow('Reservation not found');
        });
    });

    describe('createReservation', () => {
        it('should create a reservation with confirmation code', async () => {
            const result = await createReservation(restaurantId, {
                date: '2025-01-15T00:00:00.000Z',
                time: '19:00',
                partySize: 4,
                guestName: 'John Doe',
                guestPhone: '+1234567890',
            });

            expect(result).toBeDefined();
            expect(result.confirmationCode).toBeDefined();
            expect(result.confirmationCode).toMatch(/^YR/); // Starts with YR prefix
            expect(result.guestName).toBe('John Doe');
            expect(result.status).toBe('CONFIRMED');
            expect(result.source).toBe('DASHBOARD');
        });

        it('should create a reservation with optional fields', async () => {
            const result = await createReservation(restaurantId, {
                date: '2025-01-15T00:00:00.000Z',
                time: '19:00',
                partySize: 4,
                guestName: 'John Doe',
                guestPhone: '+1234567890',
                guestEmail: 'john@example.com',
                occasion: 'Birthday',
                specialRequests: 'Window seat please',
                dietaryNotes: 'Vegetarian',
            });

            expect(result.guestEmail).toBe('john@example.com');
            expect(result.occasion).toBe('Birthday');
            expect(result.specialRequests).toBe('Window seat please');
            expect(result.dietaryNotes).toBe('Vegetarian');
        });
    });

    describe('updateReservation', () => {
        it('should update reservation fields', async () => {
            const reservation = await Reservation.create({
                restaurant: restaurantId,
                date: new Date('2025-01-15'),
                time: '19:00',
                partySize: 4,
                guestName: 'John Doe',
                guestPhone: '+1234567890',
                status: 'CONFIRMED',
            });

            const result = await updateReservation(
                reservation._id.toString(),
                restaurantId,
                { partySize: 6, time: '20:00' }
            );

            expect(result.partySize).toBe(6);
            expect(result.time).toBe('20:00');
            expect(result.guestName).toBe('John Doe'); // Unchanged
        });

        it('should set confirmedAt when status changes to CONFIRMED', async () => {
            const reservation = await Reservation.create({
                restaurant: restaurantId,
                date: new Date('2025-01-15'),
                time: '19:00',
                partySize: 4,
                guestName: 'John Doe',
                guestPhone: '+1234567890',
                status: 'PENDING',
            });

            const result = await updateReservation(
                reservation._id.toString(),
                restaurantId,
                { status: 'CONFIRMED' }
            );

            expect(result.status).toBe('CONFIRMED');
            expect(result.confirmedAt).toBeDefined();
        });

        it('should set seatedAt when status changes to SEATED', async () => {
            const reservation = await Reservation.create({
                restaurant: restaurantId,
                date: new Date('2025-01-15'),
                time: '19:00',
                partySize: 4,
                guestName: 'John Doe',
                guestPhone: '+1234567890',
                status: 'CONFIRMED',
            });

            const result = await updateReservation(
                reservation._id.toString(),
                restaurantId,
                { status: 'SEATED' }
            );

            expect(result.status).toBe('SEATED');
            expect(result.seatedAt).toBeDefined();
        });

        it('should throw error for non-existent reservation', async () => {
            const fakeId = new mongoose.Types.ObjectId().toString();
            await expect(
                updateReservation(fakeId, restaurantId, { partySize: 6 })
            ).rejects.toThrow('Reservation not found');
        });
    });

    describe('deleteReservation', () => {
        it('should delete a reservation', async () => {
            const reservation = await Reservation.create({
                restaurant: restaurantId,
                date: new Date('2025-01-15'),
                time: '19:00',
                partySize: 4,
                guestName: 'John Doe',
                guestPhone: '+1234567890',
            });

            const result = await deleteReservation(reservation._id.toString(), restaurantId);
            expect(result.success).toBe(true);

            // Verify it's actually deleted
            const found = await Reservation.findById(reservation._id);
            expect(found).toBeNull();
        });

        it('should throw error for non-existent reservation', async () => {
            const fakeId = new mongoose.Types.ObjectId().toString();
            await expect(
                deleteReservation(fakeId, restaurantId)
            ).rejects.toThrow('Reservation not found');
        });
    });
});
