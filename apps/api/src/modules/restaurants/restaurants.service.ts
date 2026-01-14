import { Restaurant } from '../../models/index.js';
import { UpdateRestaurantInput } from './restaurants.schema.js';
import { cacheService, CacheKeys } from '../../utils/cache.js';
import { CACHE_KEY_RESTAURANT_DEFAULT } from '../whatsapp/tools.service.js';

// Get restaurant by ID (with caching)
export async function getRestaurant(id: string) {
    return cacheService.getOrSetCache(
        CacheKeys.restaurantConfig(id),
        async () => Restaurant.findById(id).lean()
    );
}

export async function updateRestaurant(id: string, data: UpdateRestaurantInput) {
    const restaurant = await Restaurant.findByIdAndUpdate(
        id,
        { $set: data },
        { new: true, runValidators: true }
    ).lean();

    if (!restaurant) throw new Error('Restaurant not found');

    // Invalidate cache - both the ID-specific cache and the default cache used by AI agent
    await cacheService.del(CacheKeys.restaurantConfig(id));
    await cacheService.del(CACHE_KEY_RESTAURANT_DEFAULT);

    return restaurant;
}
