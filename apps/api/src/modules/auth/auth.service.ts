import { User, Restaurant, IUser } from '../../models/index.js';
import { RegisterInput, LoginInput } from './auth.schema.js';
import { env } from '../../config/env.js';
import jwt from 'jsonwebtoken';

// JWT payload type
interface JwtPayload {
    userId: string;
    email: string;
    role: string;
    restaurantId: string;
}

// Generate access token (short-lived)
export const generateAccessToken = (user: IUser): string => {
    const payload: JwtPayload = {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        restaurantId: user.restaurant.toString(),
    };
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '15m' });
};

// Generate refresh token (long-lived)
export const generateRefreshToken = (user: IUser): string => {
    return jwt.sign(
        { userId: user._id.toString() },
        env.JWT_SECRET,
        { expiresIn: env.JWT_EXPIRES_IN }
    );
};

// Verify token
export const verifyToken = (token: string): JwtPayload | null => {
    try {
        return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    } catch {
        return null;
    }
};

// Register new user and restaurant
export const registerUser = async (input: RegisterInput) => {
    // Check if email already exists
    const existingUser = await User.findOne({ email: input.email.toLowerCase() });
    if (existingUser) {
        throw new Error('Email already registered');
    }

    // Check if restaurant slug already exists
    const existingRestaurant = await Restaurant.findOne({ slug: input.restaurantSlug.toLowerCase() });
    if (existingRestaurant) {
        throw new Error('Restaurant slug already taken');
    }

    // Create restaurant first
    const restaurant = await Restaurant.create({
        name: input.restaurantName,
        slug: input.restaurantSlug.toLowerCase(),
        phone: input.phone || '',
        email: input.email.toLowerCase(),
        address: 'TBD',
        city: 'TBD',
        state: 'TBD',
        country: 'TBD',
        postalCode: 'TBD',
    });

    // Create user (owner)
    const user = await User.create({
        email: input.email.toLowerCase(),
        passwordHash: input.password, // Will be hashed by pre-save hook
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        role: 'OWNER',
        restaurant: restaurant._id,
    });

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    return {
        user: {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
        },
        restaurant: {
            id: restaurant._id,
            name: restaurant.name,
            slug: restaurant.slug,
        },
        accessToken,
        refreshToken,
    };
};

// Login user
export const loginUser = async (input: LoginInput) => {
    // Find user by email
    const user = await User.findOne({ email: input.email.toLowerCase() });
    if (!user) {
        throw new Error('Invalid email or password');
    }

    // Check password
    const isValidPassword = await user.comparePassword(input.password);
    if (!isValidPassword) {
        throw new Error('Invalid email or password');
    }

    // Get restaurant
    const restaurant = await Restaurant.findById(user.restaurant);
    if (!restaurant) {
        throw new Error('Restaurant not found');
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    return {
        user: {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
        },
        restaurant: {
            id: restaurant._id,
            name: restaurant.name,
            slug: restaurant.slug,
        },
        accessToken,
        refreshToken,
    };
};

// Refresh access token
export const refreshAccessToken = async (refreshToken: string) => {
    const payload = verifyToken(refreshToken);
    if (!payload || !payload.userId) {
        throw new Error('Invalid refresh token');
    }

    const user = await User.findById(payload.userId);
    if (!user) {
        throw new Error('User not found');
    }

    const newAccessToken = generateAccessToken(user);

    return {
        accessToken: newAccessToken,
    };
};

// Get current user
export const getCurrentUser = async (userId: string) => {
    const user = await User.findById(userId).populate('restaurant');
    if (!user) {
        throw new Error('User not found');
    }

    return {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role,
        restaurant: user.restaurant,
    };
};
