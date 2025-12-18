import { listReservations, createReservation } from '../reservations/reservations.service.js';
import { Customer, Restaurant, Table } from '../../models/index.js';
import { cacheService, CacheKeys } from '../../utils/cache.js';
import type { RestaurantInfo } from './agent.service.js';

export const CACHE_KEY_RESTAURANT_DEFAULT = 'restaurant:default:config';

// Helper: Get cached restaurant (for single-restaurant MVP)
async function getCachedRestaurant() {
    // For MVP, we get the first restaurant. In multi-tenant, pass restaurantId.
    const cacheKey = CACHE_KEY_RESTAURANT_DEFAULT;

    return cacheService.getOrSetCache(
        cacheKey,
        async () => {
            const restaurant = await Restaurant.findOne().lean();
            return restaurant;
        },
        3600 // 1 hour TTL
    );
}

// Helper: Convert DB restaurant to RestaurantInfo for agent
export async function getRestaurantInfoForAgent(): Promise<RestaurantInfo | null> {
    const restaurant = await getCachedRestaurant();
    if (!restaurant) return null;

    return {
        id: restaurant._id.toString(),
        name: restaurant.name,
        description: restaurant.description,
        phone: restaurant.phone,
        email: restaurant.email,
        address: restaurant.address,
        city: restaurant.city,
        state: restaurant.state,
        country: restaurant.country,
        website: restaurant.website,
        cuisine: restaurant.cuisine || [],
        operatingHours: restaurant.operatingHours,
        aiPrompt: restaurant.aiPrompt,
        additionalContext: restaurant.additionalContext,
    };
}

// Format operating hours for display
function formatOperatingHours(operatingHours: any): string {
    if (!operatingHours) return 'Hours not configured';

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const lines: string[] = [];

    for (const day of days) {
        const hours = operatingHours[day];
        if (!hours) continue;

        const dayName = day.charAt(0).toUpperCase() + day.slice(1);
        if (hours.closed) {
            lines.push(`${dayName}: Closed`);
        } else if (hours.open && hours.close) {
            lines.push(`${dayName}: ${hours.open} - ${hours.close}`);
        }
    }

    return lines.length > 0 ? lines.join('\n') : 'Hours not configured';
}

// Real tool execution linked to services
export async function executeTool(name: string, args: any) {
    console.log(`[Tool Service] Executing ${name} with args:`, args);

    try {
        if (name === 'getRestaurantInfo') {
            const restaurant = await getCachedRestaurant();
            if (!restaurant) return { error: 'No restaurant configured' };

            const { infoType } = args;

            switch (infoType) {
                case 'hours':
                    return {
                        operatingHours: formatOperatingHours(restaurant.operatingHours),
                        message: `Our operating hours are:\n${formatOperatingHours(restaurant.operatingHours)}`
                    };

                case 'location':
                    return {
                        address: restaurant.address,
                        city: restaurant.city,
                        state: restaurant.state,
                        country: restaurant.country,
                        postalCode: restaurant.postalCode,
                        googleMapsUrl: restaurant.location?.googleMapsUrl,
                        message: `We are located at ${restaurant.address}, ${restaurant.city}, ${restaurant.state} ${restaurant.postalCode}`
                    };

                case 'contact':
                    return {
                        phone: restaurant.phone,
                        email: restaurant.email,
                        website: restaurant.website,
                        message: `You can reach us at ${restaurant.phone} or email ${restaurant.email}`
                    };

                case 'services':
                    return {
                        services: restaurant.services || [],
                        message: restaurant.services?.length
                            ? `We offer: ${restaurant.services.map((s: any) => s.name).join(', ')}`
                            : 'No special services configured'
                    };

                case 'policies':
                    return {
                        additionalContext: restaurant.additionalContext,
                        message: restaurant.additionalContext || 'No specific policies noted'
                    };

                case 'general':
                default:
                    return {
                        name: restaurant.name,
                        description: restaurant.description,
                        cuisine: restaurant.cuisine,
                        phone: restaurant.phone,
                        email: restaurant.email,
                        address: `${restaurant.address}, ${restaurant.city}`,
                        operatingHours: formatOperatingHours(restaurant.operatingHours),
                        message: `${restaurant.name} - ${restaurant.description || 'No description available'}`
                    };
            }
        }

        if (name === 'checkAvailability') {
            const restaurant = await getCachedRestaurant();
            if (!restaurant) return { error: 'No restaurant configured' };

            const { date, partySize } = args; // time is optional now if we want to list all
            const requestedTime = args.time;

            // 1. Determine Day of Week
            const dateObj = new Date(date);
            const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const dayName = days[dateObj.getDay()];

            // 2. Get Operating Hours
            // @ts-ignore
            const hours = restaurant.operatingHours?.[dayName];

            if (!hours || hours.closed || !hours.open || !hours.close) {
                return { available: false, message: `We are closed on ${dayName}s.` };
            }

            // 3. Generate Slots (30 min intervals)
            const slots: string[] = [];
            let [openHour, openMin] = hours.open.split(':').map(Number);
            const [closeHour, closeMin] = hours.close.split(':').map(Number);

            let current = new Date(date);
            current.setHours(openHour, openMin, 0, 0);

            const closeTime = new Date(date);
            closeTime.setHours(closeHour, closeMin, 0, 0);

            // Fetch all reservations for the day
            const dayReservations = await listReservations(restaurant._id.toString(), { date });

            // Fetch tables to determine capacity (tables not cached as they may change more frequently)
            const tables = await Table.find({ restaurant: restaurant._id, isActive: true });
            const totalCapacity = tables.reduce((sum: number, t: any) => sum + (t.capacity >= (partySize || 1) ? 1 : 0), 0) || 5; // Default to 5 "tables" if none defined

            // Simple loop to generate slots
            // 4. Return result
            if (requestedTime) {
                if (slots.includes(requestedTime)) {
                    return { available: true, message: `Yes, ${requestedTime} is available for ${partySize} people.` };
                } else {
                    const suggestions = slots.length > 0 ? slots.slice(0, 5).join(', ') : 'No other times';
                    return { available: false, message: `Sorry, ${requestedTime} is not available. We have openings at: ${suggestions}` };
                }
            } else {
                // Return FULL list of slots with status for grid formatting
                const allSlots: { time: string; available: boolean }[] = [];
                current = new Date(date);
                current.setHours(openHour, openMin, 0, 0);

                while (current < closeTime) {
                    const timeString = current.toTimeString().slice(0, 5);
                    const usage = dayReservations.filter((r: any) => r.time === timeString).length;
                    const isAvailable = usage < totalCapacity;
                    allSlots.push({ time: timeString, available: isAvailable });
                    current.setMinutes(current.getMinutes() + 30);
                }

                if (allSlots.every(s => !s.available)) {
                    return { available: false, message: `Fully booked for this date.` };
                }

                return {
                    available: true,
                    slots: allSlots,
                    message: `Please format the availabilities as a grid. Here is the data: ${JSON.stringify(allSlots)}`
                };
            }
        }

        if (name === 'createReservation') {
            const restaurant = await getCachedRestaurant();
            if (!restaurant) return { error: 'No restaurant configured' };

            // Ensure customer exists or update
            // Logic handled in service, but we might want to update phone

            const reservation = await createReservation(restaurant._id.toString(), {
                ...args,
                guestEmail: args.guestEmail || undefined, // optional
                occasion: args.specialRequests, // mapping
            });

            return {
                success: true,
                confirmationCode: reservation.confirmationCode,
                id: reservation._id,
                message: 'Reservation created successfully.'
            };
        }

        return { error: `Unknown tool: ${name}` };
    } catch (error: any) {
        console.error('Tool execution error:', error);
        return { error: error.message || 'Internal tool error' };
    }
}

