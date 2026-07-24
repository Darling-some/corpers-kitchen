import type { MenuItem } from '../types'

export const SEED_MENU: Omit<MenuItem, 'id'>[] = [
  { name: 'Noodles', category: 'main', price: 800, stockStatus: 'available', sortOrder: 1,
    description: 'Stir-fried noodles tossed in-house, ready in minutes.', timingMode: 'per_order', prepMinutes: 11 },
  { name: 'Potatoes', category: 'main', price: 800, stockStatus: 'available', sortOrder: 2,
    description: 'Golden fried potatoes, cut and fried fresh to order.', timingMode: 'per_order', prepMinutes: 11 },
  { name: 'Egg', category: 'protein', price: 200, stockStatus: 'available', sortOrder: 3, timingMode: 'per_order', prepMinutes: 11 },
  { name: 'Sausage', category: 'protein', price: 300, stockStatus: 'available', sortOrder: 4, timingMode: 'per_order', prepMinutes: 11 },
  { name: 'Drinks', category: 'drink', price: 400, stockStatus: 'available', sortOrder: 5,
    description: 'Chilled soft drinks and bottled water.', timingMode: 'per_order', prepMinutes: 2 },
  { name: 'Extra Egg', category: 'extra', price: 200, stockStatus: 'available', sortOrder: 6, timingMode: 'per_order', prepMinutes: 11 },
  { name: 'Extra Sausage', category: 'extra', price: 300, stockStatus: 'available', sortOrder: 7, timingMode: 'per_order', prepMinutes: 11 },
  { name: 'Extra Vegetables', category: 'extra', price: 150, stockStatus: 'available', sortOrder: 8, timingMode: 'per_order', prepMinutes: 11 },
  { name: 'Extra Pepper', category: 'extra', price: 100, stockStatus: 'available', sortOrder: 9, timingMode: 'per_order', prepMinutes: 11 },
  { name: 'Special Jollof Rice', category: 'weekend_special', price: 1000, stockStatus: 'available',
    sortOrder: 10, availableOnDays: [6], description: 'Saturday-only smoky party jollof.', timingMode: 'fixed_time' },
  { name: 'Special Spaghetti', category: 'weekend_special', price: 900, stockStatus: 'available',
    sortOrder: 11, availableOnDays: [0], description: 'Sunday-only spaghetti in rich tomato sauce.', timingMode: 'fixed_time' },
]
