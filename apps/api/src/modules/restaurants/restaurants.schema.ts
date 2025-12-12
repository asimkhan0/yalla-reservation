import { z } from 'zod';

export const updateRestaurantSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    whatsappNumber: z.string().optional(),
    whatsappEnabled: z.boolean().optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
    website: z.string().optional(),
});

export type UpdateRestaurantInput = z.infer<typeof updateRestaurantSchema>;
