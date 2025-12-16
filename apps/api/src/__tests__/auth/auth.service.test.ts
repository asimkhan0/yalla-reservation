import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
    connectTestDb,
    disconnectTestDb,
    clearTestDb,
    createMockUserData,
} from '../utils/test-helpers.js';
import {
    generateAccessToken,
    generateRefreshToken,
    verifyToken,
    registerUser,
    loginUser,
    refreshAccessToken,
    getCurrentUser,
} from '../../modules/auth/auth.service.js';
import { User, Restaurant } from '../../models/index.js';

describe('Auth Service', () => {
    beforeAll(async () => {
        await connectTestDb();
    });

    afterAll(async () => {
        await disconnectTestDb();
    });

    beforeEach(async () => {
        await clearTestDb();
    });

    describe('Token Functions', () => {
        it('generateAccessToken should return a valid JWT', async () => {
            // Create a user in DB to get a valid IUser document
            const restaurant = await Restaurant.create({
                name: 'Test Restaurant',
                slug: 'test-restaurant',
                phone: '+1234567890',
                email: 'test@restaurant.com',
                address: '123 Main St',
                city: 'Test City',
                state: 'TS',
                country: 'Testland',
                postalCode: '12345',
            });

            const user = await User.create({
                email: 'test@example.com',
                passwordHash: 'hashedPassword123',
                firstName: 'Test',
                lastName: 'User',
                role: 'OWNER',
                restaurant: restaurant._id,
            });

            const token = generateAccessToken(user);

            expect(token).toBeDefined();
            expect(typeof token).toBe('string');
            expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
        });

        it('generateRefreshToken should return a valid JWT', async () => {
            const restaurant = await Restaurant.create({
                name: 'Test Restaurant',
                slug: 'test-restaurant-2',
                phone: '+1234567890',
                email: 'test2@restaurant.com',
                address: '123 Main St',
                city: 'Test City',
                state: 'TS',
                country: 'Testland',
                postalCode: '12345',
            });

            const user = await User.create({
                email: 'test2@example.com',
                passwordHash: 'hashedPassword123',
                firstName: 'Test',
                lastName: 'User',
                role: 'OWNER',
                restaurant: restaurant._id,
            });

            const token = generateRefreshToken(user);

            expect(token).toBeDefined();
            expect(typeof token).toBe('string');
        });

        it('verifyToken should return payload for valid token', async () => {
            const restaurant = await Restaurant.create({
                name: 'Test Restaurant',
                slug: 'test-restaurant-3',
                phone: '+1234567890',
                email: 'test3@restaurant.com',
                address: '123 Main St',
                city: 'Test City',
                state: 'TS',
                country: 'Testland',
                postalCode: '12345',
            });

            const user = await User.create({
                email: 'test3@example.com',
                passwordHash: 'hashedPassword123',
                firstName: 'Test',
                lastName: 'User',
                role: 'OWNER',
                restaurant: restaurant._id,
            });

            const token = generateAccessToken(user);
            const payload = verifyToken(token);

            expect(payload).not.toBeNull();
            expect(payload?.userId).toBe(user._id.toString());
            expect(payload?.email).toBe('test3@example.com');
            expect(payload?.role).toBe('OWNER');
        });

        it('verifyToken should return null for invalid token', () => {
            const payload = verifyToken('invalid-token');
            expect(payload).toBeNull();
        });
    });

    describe('registerUser', () => {
        it('should create a new user and restaurant', async () => {
            const input = {
                email: 'newuser@example.com',
                password: 'securePassword123',
                firstName: 'New',
                lastName: 'User',
                phone: '+1234567890',
                restaurantName: 'New Restaurant',
                restaurantSlug: 'new-restaurant',
            };

            const result = await registerUser(input);

            expect(result.user).toBeDefined();
            expect(result.user.email).toBe('newuser@example.com');
            expect(result.user.firstName).toBe('New');
            expect(result.user.role).toBe('OWNER');
            expect(result.restaurant).toBeDefined();
            expect(result.restaurant.name).toBe('New Restaurant');
            expect(result.restaurant.slug).toBe('new-restaurant');
            expect(result.accessToken).toBeDefined();
            expect(result.refreshToken).toBeDefined();
        });

        it('should throw error for duplicate email', async () => {
            const input = {
                email: 'duplicate@example.com',
                password: 'securePassword123',
                firstName: 'First',
                lastName: 'User',
                phone: '+1234567890',
                restaurantName: 'First Restaurant',
                restaurantSlug: 'first-restaurant',
            };

            await registerUser(input);

            await expect(registerUser({
                ...input,
                restaurantName: 'Second Restaurant',
                restaurantSlug: 'second-restaurant',
            })).rejects.toThrow('Email already registered');
        });

        it('should throw error for duplicate restaurant slug', async () => {
            const input = {
                email: 'user1@example.com',
                password: 'securePassword123',
                firstName: 'User',
                lastName: 'One',
                phone: '+1234567890',
                restaurantName: 'Unique Restaurant',
                restaurantSlug: 'unique-slug',
            };

            await registerUser(input);

            await expect(registerUser({
                ...input,
                email: 'user2@example.com',
                restaurantName: 'Another Restaurant',
            })).rejects.toThrow('Restaurant slug already taken');
        });
    });

    describe('loginUser', () => {
        beforeEach(async () => {
            // Create a test user for login tests
            await registerUser({
                email: 'login@example.com',
                password: 'correctPassword123',
                firstName: 'Login',
                lastName: 'User',
                phone: '+1234567890',
                restaurantName: 'Login Restaurant',
                restaurantSlug: 'login-restaurant',
            });
        });

        it('should login with valid credentials', async () => {
            const result = await loginUser({
                email: 'login@example.com',
                password: 'correctPassword123',
            });

            expect(result.user).toBeDefined();
            expect(result.user.email).toBe('login@example.com');
            expect(result.accessToken).toBeDefined();
            expect(result.refreshToken).toBeDefined();
            expect(result.restaurant).toBeDefined();
        });

        it('should throw error for invalid email', async () => {
            await expect(loginUser({
                email: 'nonexistent@example.com',
                password: 'correctPassword123',
            })).rejects.toThrow('Invalid email or password');
        });

        it('should throw error for invalid password', async () => {
            await expect(loginUser({
                email: 'login@example.com',
                password: 'wrongPassword',
            })).rejects.toThrow('Invalid email or password');
        });
    });

    describe('refreshAccessToken', () => {
        it('should return new access token for valid refresh token', async () => {
            const registerResult = await registerUser({
                email: 'refresh@example.com',
                password: 'password123',
                firstName: 'Refresh',
                lastName: 'User',
                phone: '+1234567890',
                restaurantName: 'Refresh Restaurant',
                restaurantSlug: 'refresh-restaurant',
            });

            const result = await refreshAccessToken(registerResult.refreshToken);

            expect(result.accessToken).toBeDefined();
            expect(typeof result.accessToken).toBe('string');
        });

        it('should throw error for invalid refresh token', async () => {
            await expect(refreshAccessToken('invalid-token')).rejects.toThrow('Invalid refresh token');
        });
    });

    describe('getCurrentUser', () => {
        it('should return user with populated restaurant', async () => {
            const registerResult = await registerUser({
                email: 'current@example.com',
                password: 'password123',
                firstName: 'Current',
                lastName: 'User',
                phone: '+1234567890',
                restaurantName: 'Current Restaurant',
                restaurantSlug: 'current-restaurant',
            });

            const result = await getCurrentUser(registerResult.user.id.toString());

            expect(result).toBeDefined();
            expect(result.email).toBe('current@example.com');
            expect(result.firstName).toBe('Current');
            expect(result.restaurant).toBeDefined();
        });

        it('should throw error for non-existent user', async () => {
            const fakeId = '507f1f77bcf86cd799439011';
            await expect(getCurrentUser(fakeId)).rejects.toThrow('User not found');
        });
    });
});
