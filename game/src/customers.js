// Customers: who walks in, what they want, and how long they will wait.
// A customer stands at a counter slot with an order bubble overhead and a
// patience bar draining underneath it. Serve every dish in the order and
// they pay and leave happy; let patience hit zero and they storm off, which
// costs the stall a heart.

import { randomOrder } from './orders.js';

const NAMES = [
  'Maya', 'Riko', 'Sari', 'Danu', 'Lila', 'Bimo', 'Nadia', 'Arka',
  'Tari', 'Yusuf', 'Kiki', 'Dewi', 'Fajar', 'Intan', 'Raka', 'Wulan',
];
const SHIRT_COLORS = ['#d94f3d', '#3d7bd9', '#e8a13c', '#4caf7d', '#8e5fc0', '#d94f8e', '#2f9e9e', '#c96f4a'];
const SKIN_TONES = ['#f2c89b', '#c98d5e', '#8a5a33', '#f7d7b0', '#a06a3b'];
const HAIR_COLORS = ['#2b2118', '#5a3a22', '#8a6a3b', '#3b3b3b', '#a33b2e'];

/** Seat a new customer at `slot` with an order sized for the day. */
export function createCustomer(random, day, slot, patienceBonus) {
  const maxPatience = day.patience * patienceBonus;
  return {
    id: random.int(1, 1000000),
    slot,
    name: random.pick(NAMES),
    order: randomOrder(random, day.maxItems),
    served: [],
    patience: maxPatience,
    maxPatience,
    shirt: random.pick(SHIRT_COLORS),
    skin: random.pick(SKIN_TONES),
    hair: random.pick(HAIR_COLORS),
    arrivedAt: 0,
    leaving: false,
    leaveTimer: 0,
  };
}

/** Patience left as a fraction, 1 when fresh, 0 when they walk out. */
export function patienceFraction(customer) {
  return Math.max(0, customer.patience / customer.maxPatience);
}

/** True when the customer still wants `dishId` (ordered, not yet served). */
export function customerWants(customer, dishId) {
  return customer.order.includes(dishId) && !customer.served.includes(dishId);
}

/** True when every dish in the order has been served. */
export function customerSatisfied(customer) {
  return customer.order.every((dishId) => customer.served.includes(dishId));
}

/**
 * Hand `dishId` to the customer. Returns true when it was wanted (and marks
 * it served); serving a dish nobody ordered is refused, not wasted.
 */
export function serveDishTo(customer, dishId) {
  if (!customerWants(customer, dishId)) return false;
  customer.served.push(dishId);
  return true;
}
