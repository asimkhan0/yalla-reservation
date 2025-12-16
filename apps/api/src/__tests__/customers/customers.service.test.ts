import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
    connectTestDb,
    disconnectTestDb,
    clearTestDb,
    createMockRestaurantData,
    createMockCustomerData,
} from '../utils/test-helpers.js';
import { listCustomers } from '../../modules/customers/customers.service.js';
import { Restaurant, Customer } from '../../models/index.js';

describe('Customers Service', () => {
    let restaurantId: string;

    beforeAll(async () => {
        await connectTestDb();
    });

    afterAll(async () => {
        await disconnectTestDb();
    });

    beforeEach(async () => {
        await clearTestDb();
        const restaurant = await Restaurant.create(createMockRestaurantData());
        restaurantId = restaurant._id.toString();
    });

    describe('listCustomers', () => {
        it('should return empty result when no customers', async () => {
            const result = await listCustomers(restaurantId, {});
            expect(result.customers).toEqual([]);
            expect(result.pagination.total).toBe(0);
        });

        it('should return paginated customers', async () => {
            // Create 25 customers
            for (let i = 0; i < 25; i++) {
                await Customer.create(createMockCustomerData(restaurantId, {
                    phone: `+123456789${i.toString().padStart(2, '0')}`,
                    firstName: `Customer${i}`,
                }));
            }

            const result = await listCustomers(restaurantId, { page: 1, limit: 10 });

            expect(result.customers).toHaveLength(10);
            expect(result.pagination.total).toBe(25);
            expect(result.pagination.page).toBe(1);
            expect(result.pagination.limit).toBe(10);
            expect(result.pagination.pages).toBe(3);
        });

        it('should return correct page', async () => {
            for (let i = 0; i < 25; i++) {
                await Customer.create(createMockCustomerData(restaurantId, {
                    phone: `+123456789${i.toString().padStart(2, '0')}`,
                    firstName: `Customer${i}`,
                }));
            }

            const result = await listCustomers(restaurantId, { page: 3, limit: 10 });

            expect(result.customers).toHaveLength(5); // Last page has 5 items
            expect(result.pagination.page).toBe(3);
        });

        it('should filter by search term (firstName)', async () => {
            await Customer.create(createMockCustomerData(restaurantId, {
                phone: '+1111111111',
                firstName: 'John',
            }));
            await Customer.create(createMockCustomerData(restaurantId, {
                phone: '+2222222222',
                firstName: 'Jane',
            }));
            await Customer.create(createMockCustomerData(restaurantId, {
                phone: '+3333333333',
                firstName: 'Bob',
            }));

            const result = await listCustomers(restaurantId, { search: 'John' });

            expect(result.customers).toHaveLength(1);
            expect(result.customers[0]?.firstName).toBe('John');
        });

        it('should filter by search term (phone)', async () => {
            await Customer.create(createMockCustomerData(restaurantId, {
                phone: '+1234567890',
                firstName: 'John',
            }));
            await Customer.create(createMockCustomerData(restaurantId, {
                phone: '+9876543210',
                firstName: 'Jane',
            }));

            const result = await listCustomers(restaurantId, { search: '1234' });

            expect(result.customers).toHaveLength(1);
            expect(result.customers[0]?.phone).toBe('+1234567890');
        });

        it('should only return customers for the specified restaurant', async () => {
            const otherRestaurant = await Restaurant.create(createMockRestaurantData({
                slug: 'other-restaurant',
                email: 'other@restaurant.com',
            }));

            await Customer.create(createMockCustomerData(restaurantId, {
                phone: '+1111111111',
                firstName: 'OurCustomer',
            }));
            await Customer.create(createMockCustomerData(otherRestaurant._id.toString(), {
                phone: '+2222222222',
                firstName: 'TheirCustomer',
            }));

            const result = await listCustomers(restaurantId, {});

            expect(result.customers).toHaveLength(1);
            expect(result.customers[0]?.firstName).toBe('OurCustomer');
        });
    });
});
