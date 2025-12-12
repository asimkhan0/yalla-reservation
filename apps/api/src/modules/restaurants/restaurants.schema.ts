import { z } from 'zod';

const operatingHoursSchema = z.object({
    open: z.string().optional(),
    close: z.string().optional(),
    closed: z.boolean().optional(),
}).optional();

export const updateRestaurantSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    whatsappNumber: z.string().optional(),
    whatsappEnabled: z.boolean().optional(),
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
