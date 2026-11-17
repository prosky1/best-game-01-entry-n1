// The kitchen: six station slots (one per dish) and the serving counter.
// Starting a dish cooks it for its cook time; when it finishes it moves to
// the counter tray, or waits on its station, marked ready, when the tray is
// full. Serving takes dishes off the tray.

import { BASE_TRAY_SLOTS, DISH_BY_ID } from './config.js';

/** A fresh kitchen: nothing cooking, an empty counter. */
export function createKitchen() {
  return { cooking: new Map(), waiting: new Map(), tray: [] };
}

/** How many dishes the counter holds with the current upgrades. */
export function trayCapacity(upgradeLevels) {
  return BASE_TRAY_SLOTS + (upgradeLevels.tray ?? 0) * 2;
}

/** The cook time of a dish with the current stove upgrades. */
export function dishCookTime(dishId, upgradeLevels) {
  const speed = 1 + (upgradeLevels.stove ?? 0) * 0.2;
  return DISH_BY_ID[dishId].cookTime / speed;
}

/** True when the dish's station is free to start a batch. */
export function stationFree(kitchen, dishId) {
  return !kitchen.cooking.has(dishId) && !kitchen.waiting.has(dishId);
}

/** Start cooking a dish; false when its station is busy. */
export function startCooking(kitchen, dishId, upgradeLevels) {
  if (!stationFree(kitchen, dishId)) return false;
  kitchen.cooking.set(dishId, { elapsed: 0, total: dishCookTime(dishId, upgradeLevels) });
  return true;
}

/** Cooking progress of a dish, 0..1, or null when its station is idle. */
export function cookingProgress(kitchen, dishId) {
  const batch = kitchen.cooking.get(dishId);
  if (!batch) return null;
  return Math.min(1, batch.elapsed / batch.total);
}

/** True when a finished dish is waiting on its station for tray room. */
export function dishWaiting(kitchen, dishId) {
  return kitchen.waiting.has(dishId);
}

/**
 * Advance all cooking by dt seconds. Finished dishes move to the tray (or
 * wait on the station when the tray is full). Returns the dish ids that
 * finished this step, for the sizzle sound and the tray pop.
 */
export function updateKitchen(kitchen, dt, upgradeLevels) {
  const finished = [];
  for (const [dishId, batch] of [...kitchen.cooking.entries()]) {
    batch.elapsed += dt;
    if (batch.elapsed < batch.total) continue;
    kitchen.cooking.delete(dishId);
    finished.push(dishId);
    if (kitchen.tray.length < trayCapacity(upgradeLevels)) kitchen.tray.push(dishId);
    else kitchen.waiting.set(dishId, true);
  }
  // A waiting dish claims the first free tray slot as soon as one opens.
  for (const dishId of [...kitchen.waiting.keys()]) {
    if (kitchen.tray.length >= trayCapacity(upgradeLevels)) break;
    kitchen.waiting.delete(dishId);
    kitchen.tray.push(dishId);
  }
  return finished;
}

/** Take one dish of `dishId` off the tray; false when none is there. */
export function takeFromTray(kitchen, dishId) {
  const index = kitchen.tray.indexOf(dishId);
  if (index === -1) return false;
  kitchen.tray.splice(index, 1);
  return true;
}

/** True when the tray holds at least one dish of `dishId`. */
export function trayHas(kitchen, dishId) {
  return kitchen.tray.includes(dishId);
}
