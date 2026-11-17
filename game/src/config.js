// Tuning for Sizzle & Serve: the canvas size, the menu, the five days and
// the rules that keep the rush fair. Nothing here draws or plays sound; it is
// the one place a number lives when the game needs it.

/** Logical canvas size; the renderer scales it to the window. */
export const VIEW = { width: 960, height: 600 };

/** Fixed simulation step, seconds. */
export const STEP = 1 / 60;

/** Hearts the stall starts with; losing a customer costs one. */
export const START_HEARTS = 3;

/** How many days make a full run; clearing the last one wins the game. */
export const TOTAL_DAYS = 5;

/** Best-score key in localStorage. */
export const BEST_KEY = 'sizzle-and-serve-best';

/**
 * The menu. Each dish cooks on its own station slot, so a dish can only have
 * one batch on at a time; price is what a served dish pays before its tip.
 */
export const DISHES = [
  { id: 'burger', name: 'Burger', station: 'Grill', price: 8, cookTime: 4.0, key: '1' },
  { id: 'noodles', name: 'Noodles', station: 'Pot', price: 9, cookTime: 5.0, key: '2' },
  { id: 'fries', name: 'Fries', station: 'Fryer', price: 5, cookTime: 3.0, key: '3' },
  { id: 'salad', name: 'Salad', station: 'Prep', price: 6, cookTime: 2.5, key: '4' },
  { id: 'soup', name: 'Soup', station: 'Pot', price: 10, cookTime: 6.0, key: '5' },
  { id: 'pancakes', name: 'Pancakes', station: 'Grill', price: 7, cookTime: 4.0, key: '6' },
];

/** Dishes by id, for lookups from orders, the tray and the renderer. */
export const DISH_BY_ID = Object.fromEntries(DISHES.map((dish) => [dish.id, dish]));

/** Serving-counter slots before the Bigger Counter upgrade. */
export const BASE_TRAY_SLOTS = 6;

/**
 * One row per day. target is the coins the day must earn; duration is the
 * day's seconds; spawnEvery is the mean gap between arriving customers;
 * maxCustomers caps the counter; patience is a customer's seconds before
 * they storm off; maxItems caps how many dishes one order can hold.
 */
export const DAYS = [
  { target: 40, duration: 90, spawnEvery: 8.0, maxCustomers: 3, patience: 38, maxItems: 1 },
  { target: 70, duration: 95, spawnEvery: 7.0, maxCustomers: 3, patience: 35, maxItems: 2 },
  { target: 110, duration: 100, spawnEvery: 6.0, maxCustomers: 4, patience: 32, maxItems: 2 },
  { target: 150, duration: 105, spawnEvery: 5.2, maxCustomers: 4, patience: 30, maxItems: 3 },
  { target: 200, duration: 110, spawnEvery: 4.6, maxCustomers: 4, patience: 28, maxItems: 3 },
];

/** Tip rate: a dish served with full patience left pays this share extra. */
export const TIP_RATE = 0.5;

/** Serving a whole order at once pays this bonus per dish beyond the first. */
export const COMBO_BONUS = 2;

/** Day-clear bonus per heart still held, and per second left on the clock. */
export const CLEAR_HEART_BONUS = 10;
export const CLEAR_TIME_BONUS = 2;
