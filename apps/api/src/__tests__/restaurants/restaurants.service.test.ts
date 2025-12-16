import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import {
    connectTestDb,
    disconnectTestDb,
    clearTestDb,
    createMockRestaurantData,
} from '../utils/test-helpers.js';
import { getRestaurant, updateRestaurant } from '../../modules/restaurants/restaurants.service.js';
import { Restaurant } from '../../models/index.js';
import mongoose from 'mongoose';

// Mock the cache service
vi.mock('../../utils/cache.js', () => ({
    cacheService: {
        getOrSetCache: vi.fn(async (_key: string, fn: () => Promise<any>) => fn()),
        del: vi.fn().mockResolvedValue(undefined),
    },
    CacheKeys: {
        restaurantConfig: (id: string) => `restaurant:${id}:config`,
    },
}));

describe('Restaurants Service', () => {
    let restaurantId: string;

    beforeAll(async () => {
        await connectTestDb();
    });

    afterAll(async () => {
        await disconnectTestDb();
    });

    beforeEach(async () => {
        await clearTestDb();
        const restaurant = await Restaurant.create(createMockRestaurantData({
            name: 'Test Restaurant',
            slug: 'test-restaurant',
        }));
        restaurantId = restaurant._id.toString();
    });

    describe('getRestaurant', () => {
        it('should return restaurant data', async () => {
            const result = await getRestaurant(restaurantId);

            expect(result).toBeDefined();
            expect(result?.name).toBe('Test Restaurant');
            expect(result?.slug).toBe('test-restaurant');
        });

        it('should return null for non-existent restaurant', async () => {
            const fakeId = new mongoose.Types.ObjectId().toString();
            const result = await getRestaurant(fakeId);

            expect(result).toBeNull();
        });
    });

    describe('updateRestaurant', () => {
        it('should update restaurant fields', async () => {
            const result = await updateRestaurant(restaurantId, {
                name: 'Updated Restaurant',
                description: 'A great place to eat',
            });

            expect(result.name).toBe('Updated Restaurant');
            expect(result.description).toBe('A great place to eat');
        });

        it('should update operating hours', async () => {
            const result = await updateRestaurant(restaurantId, {
                operatingHours: {
                    monday: { open: '09:00', close: '22:00', closed: false },
                    tuesday: { open: '09:00', close: '22:00', closed: false },
                    wednesday: { open: '09:00', close: '22:00', closed: false },
                    thursday: { open: '09:00', close: '22:00', closed: false },
                    friday: { open: '09:00', close: '23:00', closed: false },
                    saturday: { open: '10:00', close: '23:00', closed: false },
                    sunday: { closed: true },
                },
            });

            expect(result.operatingHours).toBeDefined();
            expect(result.operatingHours?.monday?.open).toBe('09:00');
            expect(result.operatingHours?.sunday?.closed).toBe(true);
        });

        it('should update services', async () => {
            const result = await updateRestaurant(restaurantId, {
                services: [
                    { name: 'Dine-in', description: 'Regular dining', duration: [60, 90], price: 0 },
                    { name: 'Private Event', description: 'Book the venue', duration: [180], price: 500 },
                ],
            });

            expect(result.services).toHaveLength(2);
            expect(result.services?.[0]?.name).toBe('Dine-in');
            expect(result.services?.[1]?.price).toBe(500);
        });

        it('should throw error for non-existent restaurant', async () => {
            const fakeId = new mongoose.Types.ObjectId().toString();
            await expect(
                updateRestaurant(fakeId, { name: 'New Name' })
            ).rejects.toThrow('Restaurant not found');
        });

        it('should update WhatsApp settings', async () => {
            const result = await updateRestaurant(restaurantId, {
                whatsappNumber: '+1234567890',
                whatsappEnabled: true,
            });

            expect(result.whatsappNumber).toBe('+1234567890');
            expect(result.whatsappEnabled).toBe(true);
        });

        it('should update AI settings', async () => {
            const result = await updateRestaurant(restaurantId, {
                aiPrompt: 'Be friendly and helpful',
                additionalContext: 'We specialize in Italian cuisine',
            });

            expect(result.aiPrompt).toBe('Be friendly and helpful');
            expect(result.additionalContext).toBe('We specialize in Italian cuisine');
        });
    });
});
