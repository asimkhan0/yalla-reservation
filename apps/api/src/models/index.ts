import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

// ==================== USER ====================
export interface IUser extends Document {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    phone?: string;
    avatar?: string;
    role: 'OWNER' | 'MANAGER' | 'STAFF';
    emailVerified?: Date;
    restaurant: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(password: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
    {
        email: { type: String, required: true, unique: true, lowercase: true },
        passwordHash: { type: String, required: true },
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        phone: String,
        avatar: String,
        role: { type: String, enum: ['OWNER', 'MANAGER', 'STAFF'], default: 'STAFF' },
        emailVerified: Date,
        restaurant: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    },
    { timestamps: true }
);

userSchema.index({ email: 1 });
userSchema.index({ restaurant: 1 });

userSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
    return bcrypt.compare(password, this.passwordHash);
};

userSchema.pre('save', async function (next) {
    if (this.isModified('passwordHash')) {
        this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
    }
    next();
});

export const User = mongoose.model<IUser>('User', userSchema);

// ==================== RESTAURANT ====================
export interface IRestaurant extends Document {
    name: string;
    slug: string;
    description?: string;
    cuisine: string[];
    phone: string;
    email: string;
    website?: string;
    address: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    latitude?: number;
    longitude?: number;
    timezone: string;
    logo?: string;
    coverImage?: string;
    primaryColor: string;
    accentColor: string;
    whatsappNumber?: string;
    whatsappEnabled: boolean;
    botEnabled: boolean;
    botPersonality?: Record<string, unknown>;
    plan: 'STARTER' | 'GROWTH' | 'ENTERPRISE';
    planExpiresAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const restaurantSchema = new Schema<IRestaurant>(
    {
        name: { type: String, required: true },
        slug: { type: String, required: true, unique: true, lowercase: true },
        description: String,
        cuisine: [String],
        phone: { type: String, required: true },
        email: { type: String, required: true },
        website: String,
        address: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        country: { type: String, required: true },
        postalCode: { type: String, required: true },
        latitude: Number,
        longitude: Number,
        timezone: { type: String, default: 'UTC' },
        logo: String,
        coverImage: String,
        primaryColor: { type: String, default: '#2563eb' },
        accentColor: { type: String, default: '#3b82f6' },
        whatsappNumber: { type: String, unique: true, sparse: true },
        whatsappEnabled: { type: Boolean, default: false },
        botEnabled: { type: Boolean, default: true },
        botPersonality: Schema.Types.Mixed,
        plan: { type: String, enum: ['STARTER', 'GROWTH', 'ENTERPRISE'], default: 'STARTER' },
        planExpiresAt: Date,
    },
    { timestamps: true }
);

restaurantSchema.index({ slug: 1 });
restaurantSchema.index({ whatsappNumber: 1 });

export const Restaurant = mongoose.model<IRestaurant>('Restaurant', restaurantSchema);

// ==================== TABLE ====================
export interface ITable extends Document {
    name: string;
    section?: string;
    capacity: number;
    minCapacity: number;
    isActive: boolean;
    shape: 'RECTANGLE' | 'ROUND' | 'SQUARE' | 'OVAL';
    position?: { x: number; y: number };
    restaurant: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const tableSchema = new Schema<ITable>(
    {
        name: { type: String, required: true },
        section: String,
        capacity: { type: Number, required: true },
        minCapacity: { type: Number, default: 1 },
        isActive: { type: Boolean, default: true },
        shape: { type: String, enum: ['RECTANGLE', 'ROUND', 'SQUARE', 'OVAL'], default: 'RECTANGLE' },
        position: { x: Number, y: Number },
        restaurant: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    },
    { timestamps: true }
);

tableSchema.index({ restaurant: 1 });

export const Table = mongoose.model<ITable>('Table', tableSchema);

// ==================== CUSTOMER ====================
export interface ICustomer extends Document {
    phone: string;
    phoneCountry: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    dietaryRestrictions: string[];
    preferredLanguage: string;
    notes?: string;
    totalVisits: number;
    noShows: number;
    lastVisit?: Date;
    vipStatus: boolean;
    vipNotes?: string;
    restaurant: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const customerSchema = new Schema<ICustomer>(
    {
        phone: { type: String, required: true },
        phoneCountry: { type: String, required: true },
        firstName: String,
        lastName: String,
        email: String,
        dietaryRestrictions: [String],
        preferredLanguage: { type: String, default: 'en' },
        notes: String,
        totalVisits: { type: Number, default: 0 },
        noShows: { type: Number, default: 0 },
        lastVisit: Date,
        vipStatus: { type: Boolean, default: false },
        vipNotes: String,
        restaurant: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    },
    { timestamps: true }
);

customerSchema.index({ phone: 1, restaurant: 1 }, { unique: true });
customerSchema.index({ restaurant: 1 });


export const Customer = mongoose.model<ICustomer>('Customer', customerSchema);

export * from './conversation.js';
export * from './message.js';

