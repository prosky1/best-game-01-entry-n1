// Orders: what a customer asks for. An order is a short list of dish ids,
// never repeating a dish, sized by the day — day 1 is one dish, the late
// days ask for up to three. The price of an order is the sum of its dishes.

import { DISHES, DISH_BY_ID } from './config.js';

/** Build a random order for a day whose orders hold at most `maxItems` dishes. */
export function randomOrder(random, maxItems) {
  const count = 1 + Math.floor(random.next() * maxItems);
  const pool = [...DISHES];
  const order = [];
  for (let n = 0; n < count && pool.length > 0; n += 1) {
    const index = Math.floor(random.next() * pool.length);
    order.push(pool.splice(index, 1)[0].id);
  }
  return order;
}

/** The coins an order pays before tips, from its dishes' prices. */
export function orderPrice(order) {
  return order.reduce((sum, dishId) => sum + DISH_BY_ID[dishId].price, 0);
}

/** True when every dish in the order has been served. */
export function orderComplete(order, served) {
  return order.every((dishId) => served.includes(dishId));
}
