import { Customer } from '../../models/index.js';

interface ListCustomersQuery {
    page?: number;
    limit?: number;
    search?: string;
}

export const listCustomers = async (restaurantId: string, query: ListCustomersQuery) => {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const filter: any = { restaurant: restaurantId };

    if (query.search) {
        const searchRegex = new RegExp(query.search, 'i');
        filter.$or = [
            { firstName: searchRegex },
            { lastName: searchRegex },
            { phone: searchRegex },
            { email: searchRegex },
        ];
    }

    const [customers, total] = await Promise.all([
        Customer.find(filter)
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(limit),
        Customer.countDocuments(filter)
    ]);

    return {
        customers,
        pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit)
        }
    };
};
