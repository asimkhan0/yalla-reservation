import { Restaurant } from '../../models/index.js';
import { UpdateRestaurantInput } from './restaurants.schema.js';
import { cacheService, CacheKeys } from '../../utils/cache.js';

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

    // Invalidate cache
    await cacheService.del(CacheKeys.restaurantConfig(id));

    return restaurant;
}
