import { z } from 'zod';

const operatingHoursSchema = z.object({
    open: z.string().optional(),
    close: z.string().optional(),
    closed: z.boolean().optional(),
}).optional();

const twilioConfig = z.object({
    provider: z.literal('twilio'),
    accountSid: z.string().min(1, 'Account SID is required'),
    authToken: z.string().min(1, 'Auth Token is required'),
    phoneNumber: z.string().min(1, 'Phone Number is required'),
    webhookUrl: z.string().optional(),
});

const metaConfig = z.object({
    provider: z.literal('meta'),
    phoneNumberId: z.string().min(1, 'Phone Number ID is required'),
    wabaId: z.string().min(1, 'WhatsApp Business Account ID is required'),
    accessToken: z.string().min(1, 'Permanent Access Token is required'),
    webhookVerifyToken: z.string().default(() => Math.random().toString(36).substring(7)),
    // Optional display fields (populated after verification)
    businessName: z.string().optional(),
    displayPhoneNumber: z.string().optional(),
});

export const whatsappIntegrationSchema = z.discriminatedUnion('provider', [
    twilioConfig,
    metaConfig
]).and(z.object({
    enabled: z.boolean().default(false),
}));

export const updateRestaurantSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    whatsappNumber: z.string().optional(),
    whatsappEnabled: z.boolean().optional(),
    whatsappConfig: whatsappIntegrationSchema.optional(), // New field
    address: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    website: z.string().optional(),
    logo: z.string().optional(),

    // New fields
    aiPrompt: z.string().optional(),
    additionalContext: z.string().optional(),
    location: z.object({
        address: z.string().optional(),
        googleMapsUrl: z.string().optional(),
    }).optional(),

    operatingHours: z.object({
        monday: operatingHoursSchema,
        tuesday: operatingHoursSchema,
        wednesday: operatingHoursSchema,
        thursday: operatingHoursSchema,
        friday: operatingHoursSchema,
        saturday: operatingHoursSchema,
        sunday: operatingHoursSchema,
    }).optional(),

    services: z.array(z.object({
        name: z.string(),
        description: z.string().optional(),
        duration: z.array(z.number()),
        price: z.number().optional()
    })).optional()
});

export type UpdateRestaurantInput = z.infer<typeof updateRestaurantSchema>;
