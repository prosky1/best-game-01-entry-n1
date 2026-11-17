// The world: one run of the stall across five days. It owns the day timer,
// the customers at the counter, the kitchen, the coins and the hearts, and
// steps them all forward in fixed ticks. Screens (title, shop, end) live in
// main.js; this module only knows the run's phases: 'idle' (title backdrop),
// 'play', 'dayclear', 'win' and 'over'.
//
// Events the step returns, for sounds and announcements: 'dish-ready',
// 'served', 'walkout', 'day-clear', 'day-failed', 'game-over', 'win'.

import {
  CLEAR_HEART_BONUS,
  CLEAR_TIME_BONUS,
  COMBO_BONUS,
  DAYS,
  DISH_BY_ID,
  START_HEARTS,
  TIP_RATE,
  TOTAL_DAYS,
} from './config.js';
import { createCustomer, customerSatisfied, customerWants, patienceFraction, serveDishTo } from './customers.js';
import { createKitchen, startCooking, takeFromTray, trayHas, updateKitchen } from './kitchen.js';
import { createUpgrades, patienceBonus } from './shop.js';

/** A fresh run, sitting on the title screen's idle backdrop. */
export function createWorld(random) {
  const world = {
    random,
    phase: 'idle',
    day: 1,
    coins: 0,
    score: 0,
    hearts: START_HEARTS,
    timeLeft: DAYS[0].duration,
    dayEarned: 0,
    target: DAYS[0].target,
    customers: [],
    kitchen: createKitchen(),
    upgrades: createUpgrades(),
    spawnTimer: 0,
    servedTotal: 0,
    lostTotal: 0,
    message: null,
    messageTimer: 0,
  };
  return world;
}

/** Reset the whole run to day 1, as if the stall just opened. */
export function resetRun(world) {
  world.phase = 'play';
  world.day = 1;
  world.coins = 0;
  world.score = 0;
  world.hearts = START_HEARTS;
  world.customers = [];
  world.kitchen = createKitchen();
  world.upgrades = createUpgrades();
  world.servedTotal = 0;
  world.lostTotal = 0;
  world.message = null;
  world.messageTimer = 0;
  startDay(world);
}

/** Open a day: fresh timer, fresh counter, the day's target on the board. */
export function startDay(world) {
  const day = DAYS[world.day - 1];
  world.phase = 'play';
  world.timeLeft = day.duration;
  world.dayEarned = 0;
  world.target = day.target;
  world.customers = [];
  world.kitchen = createKitchen();
  world.spawnTimer = 1.2;
  showMessage(world, `Day ${world.day} — earn $${day.target}!`);
}

/** The current day's tuning row. */
export function currentDay(world) {
  return DAYS[world.day - 1];
}

/** A short floating note over the counter (tips, warnings, day news). */
export function showMessage(world, text) {
  world.message = text;
  world.messageTimer = 2.4;
}

/** Start cooking a dish from the menu; false when its station is busy. */
export function cookDish(world, dishId) {
  if (world.phase !== 'play') return false;
  return startCooking(world.kitchen, dishId, world.upgrades);
}

/**
 * Serve the customer at `slot`. When `dishId` is given, serve that dish;
 * otherwise serve the first tray dish the customer still wants. Pays the
 * dish price plus a tip that shrinks as patience runs out, and a bonus for
 * completing a multi-dish order. Returns the coins paid, or 0 when nothing
 * was served.
 */
export function serveCustomer(world, slot, dishId) {
  if (world.phase !== 'play') return 0;
  const customer = world.customers.find((entry) => entry.slot === slot);
  if (!customer) return 0;
  const wanted = dishId ?? customer.order.find((id) => customerWants(customer, id) && trayHas(world.kitchen, id));
  if (!wanted || !customerWants(customer, wanted)) return 0;
  if (!takeFromTray(world.kitchen, wanted)) return 0;
  serveDishTo(customer, wanted);
  const patience = patienceFraction(customer);
  const tip = Math.round(DISH_BY_ID[wanted].price * TIP_RATE * patience);
  let paid = DISH_BY_ID[wanted].price + tip;
  if (customerSatisfied(customer)) {
    paid += (customer.order.length - 1) * COMBO_BONUS;
    world.customers = world.customers.filter((entry) => entry !== customer);
    world.servedTotal += 1;
    showMessage(world, `${customer.name} loved it! +$${paid}`);
  } else {
    showMessage(world, `Served ${DISH_BY_ID[wanted].name} — +$${paid}`);
  }
  world.coins += paid;
  world.score += paid;
  world.dayEarned += paid;
  return paid;
}

/** Seats a customer in the lowest free counter slot, if one is free. */
function spawnCustomer(world) {
  const day = currentDay(world);
  const taken = new Set(world.customers.map((customer) => customer.slot));
  for (let slot = 0; slot < day.maxCustomers; slot += 1) {
    if (taken.has(slot)) continue;
    const customer = createCustomer(world.random, day, slot, patienceBonus(world.upgrades));
    world.customers.push(customer);
    return;
  }
}

/** Finish the day: clear it when the target is met, else close the stall. */
function endDay(world, events) {
  if (world.dayEarned >= world.target) {
    const bonus = world.hearts * CLEAR_HEART_BONUS + Math.ceil(world.timeLeft) * CLEAR_TIME_BONUS;
    world.score += bonus;
    world.coins += bonus;
    events.push('day-clear');
    if (world.day >= TOTAL_DAYS) {
      world.phase = 'win';
      events.push('win');
    } else {
      world.phase = 'dayclear';
    }
    return;
  }
  world.phase = 'over';
  events.push('day-failed');
  events.push('game-over');
}

/** Advance the run by dt seconds; returns the events this step raised. */
export function stepWorld(world, dt) {
  const events = [];
  if (world.messageTimer > 0) {
    world.messageTimer -= dt;
    if (world.messageTimer <= 0) world.message = null;
  }
  if (world.phase === 'idle') {
    // The title backdrop: customers drift in and out, nobody is served.
    world.spawnTimer -= dt;
    if (world.spawnTimer <= 0) {
      world.spawnTimer = 3.5;
      if (world.customers.length < 3) spawnCustomer(world);
    }
    for (const customer of [...world.customers]) {
      customer.patience -= dt;
      if (customer.patience <= 0) {
        world.customers = world.customers.filter((entry) => entry !== customer);
      }
    }
    return events;
  }
  if (world.phase !== 'play') return events;

  world.timeLeft -= dt;

  // New arrivals.
  world.spawnTimer -= dt;
  if (world.spawnTimer <= 0) {
    const day = currentDay(world);
    world.spawnTimer = day.spawnEvery * world.random.range(0.7, 1.3);
    if (world.customers.length < day.maxCustomers) spawnCustomer(world);
  }

  // Patience drains; a customer out of patience storms off, costing a heart.
  for (const customer of [...world.customers]) {
    customer.patience -= dt;
    if (customer.patience > 0) continue;
    world.customers = world.customers.filter((entry) => entry !== customer);
    world.hearts -= 1;
    world.lostTotal += 1;
    events.push('walkout');
    showMessage(world, `${customer.name} stormed off! -1 heart`);
    if (world.hearts <= 0) {
      world.phase = 'over';
      events.push('game-over');
      return events;
    }
  }

  // Dishes finish cooking.
  const finished = updateKitchen(world.kitchen, dt, world.upgrades);
  if (finished.length > 0) events.push('dish-ready');

  if (world.timeLeft <= 0) {
    world.timeLeft = 0;
    endDay(world, events);
  }
  return events;
}

/** Move on after a cleared day: into the shop, then the next day. */
export function advanceToNextDay(world) {
  world.day += 1;
  startDay(world);
}
