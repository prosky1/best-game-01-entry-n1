// The screenshot scenes behind ?shot=title|play|shop|over. Each one plays
// the real rules forward from a fresh run for a fixed stretch, steered by a
// simple autopilot (serve what the tray already holds, then cook what the
// most impatient customer still wants), so the frame is what a real game
// looks like and the same seed always gives the same frame. The over scene
// runs with no help at all, as a player who walked away would.

import { STEP } from './config.js';
import { customerWants, patienceFraction } from './customers.js';
import { cookingProgress, dishWaiting, stationFree, trayHas } from './kitchen.js';
import { cookDish, resetRun, serveCustomer, stepWorld } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_SHOP, SCREEN_TITLE } from './render.js';

const TITLE_SECONDS = 12;
const PLAY_SECONDS = 45;
const SHOP_LIMIT_SECONDS = 400;
const OVER_LIMIT_SECONDS = 600;

/** Customers most urgent first (least patience left). */
function urgentFirst(world) {
  return [...world.customers].sort((a, b) => patienceFraction(a) - patienceFraction(b));
}

/** One autopilot decision: serve what is ready, then cook what is wanted. */
function autopilot(world) {
  for (const customer of urgentFirst(world)) {
    const ready = customer.order.find((dishId) => customerWants(customer, dishId) && trayHas(world.kitchen, dishId));
    if (ready) serveCustomer(world, customer.slot, ready);
  }
  for (const customer of urgentFirst(world)) {
    for (const dishId of customer.order) {
      if (!customerWants(customer, dishId)) continue;
      if (trayHas(world.kitchen, dishId)) continue;
      if (cookingProgress(world.kitchen, dishId) !== null) continue;
      if (dishWaiting(world.kitchen, dishId)) continue;
      if (stationFree(world.kitchen, dishId)) cookDish(world, dishId);
    }
  }
}

/** Step the world for `seconds`, steering with the autopilot each tick. */
function runFor(world, seconds, steer) {
  const steps = Math.floor(seconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    if (steer) autopilot(world);
    stepWorld(world, STEP);
    if (world.phase !== 'play' && world.phase !== 'idle') return;
  }
}

/**
 * Set `world` to the named scene (title, play, shop or over; anything else
 * is title) and return the screen to draw over it.
 */
export function stageShot(name, world) {
  if (name === 'play') {
    resetRun(world);
    runFor(world, PLAY_SECONDS, true);
    return { screen: SCREEN_PLAY };
  }
  if (name === 'shop') {
    resetRun(world);
    runFor(world, SHOP_LIMIT_SECONDS, true);
    return { screen: SCREEN_SHOP };
  }
  if (name === 'over') {
    resetRun(world);
    runFor(world, OVER_LIMIT_SECONDS, false);
    return { screen: SCREEN_OVER };
  }
  runFor(world, TITLE_SECONDS, false);
  return { screen: SCREEN_TITLE };
}
