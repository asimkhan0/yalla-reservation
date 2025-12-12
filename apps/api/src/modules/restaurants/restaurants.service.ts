import { Restaurant } from '../../models/index.js';
import { UpdateRestaurantInput } from './restaurants.schema.js';

export async function getRestaurant(id: string) {
    return Restaurant.findById(id).lean();
}

export async function updateRestaurant(id: string, data: UpdateRestaurantInput) {
    const restaurant = await Restaurant.findByIdAndUpdate(
        id,
        { $set: data },
        { new: true }
    ).lean();

    if (!restaurant) throw new Error('Restaurant not found');
    return restaurant;
}
