import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import {
    connectTestDb,
    disconnectTestDb,
    clearTestDb,
    createMockRestaurantData,
} from '../utils/test-helpers.js';
import { executeTool, CACHE_KEY_RESTAURANT_DEFAULT } from '../../modules/whatsapp/tools.service.js';
import { Restaurant, Table } from '../../models/index.js';
import { Reservation } from '../../models/reservation.js';
import { cacheService } from '../../utils/cache.js';

describe('WhatsApp Tools Service', () => {
    let restaurantId: string;

    beforeAll(async () => {
        await connectTestDb();
    });

    afterAll(async () => {
        await disconnectTestDb();
    });

    beforeEach(async () => {
        await clearTestDb();
        await cacheService.del(CACHE_KEY_RESTAURANT_DEFAULT);
        const restaurant = await Restaurant.create({
            ...createMockRestaurantData({
                name: 'Test Restaurant',
                slug: 'test-restaurant',
            }),
            operatingHours: {
                monday: { open: '09:00', close: '22:00', closed: false },
                tuesday: { open: '09:00', close: '22:00', closed: false },
                wednesday: { open: '09:00', close: '22:00', closed: false },
                thursday: { open: '09:00', close: '22:00', closed: false },
                friday: { open: '09:00', close: '22:00', closed: false },
                saturday: { open: '09:00', close: '22:00', closed: false },
                sunday: { closed: true },
            },
        });
        restaurantId = restaurant._id.toString();

        // Create some tables
        await Table.create({
            name: 'Table 1',
            capacity: 4,
            restaurant: restaurantId,
            isActive: true,
        });
        await Table.create({
            name: 'Table 2',
            capacity: 6,
            restaurant: restaurantId,
            isActive: true,
        });
    });

    describe('checkAvailability', () => {
        it('should return available=true for an open slot', async () => {
            // Use a Monday date
            const result = await executeTool('checkAvailability', {
                date: '2025-01-20', // Monday
                time: '19:00',
                partySize: 4,
            });

            expect(result.available).toBe(true);
            expect(result.message).toContain('19:00');
        });

        it('should return available=false for closed day', async () => {
            // Use a Sunday date
            const result = await executeTool('checkAvailability', {
                date: '2025-01-19', // Sunday
                time: '19:00',
                partySize: 4,
            });

            expect(result.available).toBe(false);
            expect(result.message).toContain('closed');
        });

        it('should return list of slots when no time specified', async () => {
            const result = await executeTool('checkAvailability', {
                date: '2025-01-20', // Monday
                partySize: 4,
            });

            expect(result.available).toBe(true);
            expect(result.slots).toBeDefined();
            expect(Array.isArray(result.slots)).toBe(true);
            expect(result.slots?.length).toBeGreaterThan(0);
        });

        it('should return available=false when slot is fully booked', async () => {
            // Create reservations to fill capacity
            for (let i = 0; i < 2; i++) {
                await Reservation.create({
                    restaurant: restaurantId,
                    date: new Date('2025-01-20'),
                    time: '19:00',
                    partySize: 4,
                    guestName: `Guest ${i}`,
                    guestPhone: `+123456789${i}`,
                    status: 'CONFIRMED',
                });
            }

            const result = await executeTool('checkAvailability', {
                date: '2025-01-20',
                time: '19:00',
                partySize: 4,
            });

            expect(result.available).toBe(false);
            expect(result.message).toContain('not available');
        });
    });

    describe('createReservation', () => {
        it('should create a reservation successfully', async () => {
            const result = await executeTool('createReservation', {
                date: '2025-01-20',
                time: '19:00',
                partySize: 4,
                guestName: 'John Doe',
                guestPhone: '+1234567890',
            });

            expect(result.success).toBe(true);
            expect(result.confirmationCode).toBeDefined();
            expect(result.confirmationCode).toMatch(/^YR/);
            expect(result.id).toBeDefined();
        });

        it('should create a reservation with special requests', async () => {
            const result = await executeTool('createReservation', {
                date: '2025-01-20',
                time: '19:00',
                partySize: 4,
                guestName: 'John Doe',
                guestPhone: '+1234567890',
                specialRequests: 'Window seat please',
            });

            expect(result.success).toBe(true);
            expect(result.confirmationCode).toBeDefined();
        });
    });

    describe('Unknown tool', () => {
        it('should return error for unknown tool', async () => {
            const result = await executeTool('unknownTool', {});

            expect(result.error).toBeDefined();
            expect(result.error).toContain('Unknown tool');
        });
    });
});
