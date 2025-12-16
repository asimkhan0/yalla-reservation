import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';

let mongoServer: MongoMemoryServer;

/**
 * Connect to an in-memory MongoDB instance for testing
 */
export async function connectTestDb() {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
}

/**
 * Disconnect and stop the in-memory MongoDB instance
 */
export async function disconnectTestDb() {
    await mongoose.disconnect();
    if (mongoServer) {
        await mongoServer.stop();
    }
}

/**
 * Clear all collections in the test database
 */
export async function clearTestDb() {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        const collection = collections[key];
        if (collection) {
            await collection.deleteMany({});
        }
    }
}

/**
 * Generate a valid JWT token for testing authenticated routes
 */
export function generateTestToken(payload: {
    userId: string;
    email: string;
    role: string;
    restaurantId: string;
}): string {
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '1h' });
}

/**
 * Create mock user data for testing
 */
export function createMockUserData(overrides: Partial<{
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    role: 'OWNER' | 'MANAGER' | 'STAFF';
}> = {}) {
    return {
        email: overrides.email || `test-${Date.now()}@example.com`,
        password: overrides.password || 'testPassword123',
        firstName: overrides.firstName || 'Test',
        lastName: overrides.lastName || 'User',
        phone: overrides.phone || '+1234567890',
        role: overrides.role || 'OWNER',
    };
}

/**
 * Create mock restaurant data for testing
 */
export function createMockRestaurantData(overrides: Partial<{
    name: string;
    slug: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
}> = {}) {
    const timestamp = Date.now();
    return {
        name: overrides.name || `Test Restaurant ${timestamp}`,
        slug: overrides.slug || `test-restaurant-${timestamp}`,
        phone: overrides.phone || '+1234567890',
        email: overrides.email || `restaurant-${timestamp}@example.com`,
        address: overrides.address || '123 Test St',
        city: overrides.city || 'Test City',
        state: overrides.state || 'TS',
        country: overrides.country || 'Testland',
        postalCode: overrides.postalCode || '12345',
    };
}

/**
 * Create mock reservation data for testing
 */
export function createMockReservationData(restaurantId: string, overrides: Partial<{
    date: string;
    time: string;
    partySize: number;
    guestName: string;
    guestPhone: string;
    guestEmail: string;
    status: string;
}> = {}) {
    return {
        restaurant: restaurantId,
        date: overrides.date || new Date().toISOString(),
        time: overrides.time || '19:00',
        partySize: overrides.partySize || 4,
        guestName: overrides.guestName || 'John Doe',
        guestPhone: overrides.guestPhone || '+1234567890',
        guestEmail: overrides.guestEmail || 'guest@example.com',
        status: overrides.status || 'CONFIRMED',
    };
}

/**
 * Create mock customer data for testing
 */
export function createMockCustomerData(restaurantId: string, overrides: Partial<{
    phone: string;
    phoneCountry: string;
    firstName: string;
    lastName: string;
    email: string;
}> = {}) {
    const timestamp = Date.now();
    return {
        restaurant: restaurantId,
        phone: overrides.phone || `+1${timestamp.toString().slice(-10)}`,
        phoneCountry: overrides.phoneCountry || 'US',
        firstName: overrides.firstName || 'Test',
        lastName: overrides.lastName || 'Customer',
        email: overrides.email || `customer-${timestamp}@example.com`,
    };
}
