// The upgrade shop, open between days. Coins earned in the kitchen buy
// lasting improvements: faster stoves, a bigger serving counter, comfier
// seats that keep customers patient, and one extra heart for the whole run.

export const UPGRADES = [
  {
    id: 'stove',
    name: 'Speedy Stove',
    desc: 'Every dish cooks 20% faster.',
    price: 30,
    maxLevel: 2,
  },
  {
    id: 'tray',
    name: 'Bigger Counter',
    desc: '+2 serving slots on the counter.',
    price: 25,
    maxLevel: 2,
  },
  {
    id: 'seats',
    name: 'Comfy Seats',
    desc: 'Customers wait 25% longer.',
    price: 35,
    maxLevel: 2,
  },
  {
    id: 'heart',
    name: 'Second Wind',
    desc: '+1 heart for the rest of the run.',
    price: 50,
    maxLevel: 1,
  },
];

/** Fresh upgrade levels: nothing bought yet. */
export function createUpgrades() {
  return { stove: 0, tray: 0, seats: 0, heart: 0 };
}

/** Price of the next level of an upgrade (each level costs 50% more). */
export function upgradePrice(upgrade, level) {
  return Math.round(upgrade.price * (1 + level * 0.5));
}

/** Patience multiplier from the Comfy Seats level. */
export function patienceBonus(upgradeLevels) {
  return 1 + (upgradeLevels.seats ?? 0) * 0.25;
}

/**
 * Buy the next level of `upgradeId` with the world's coins. Returns true on
 * a sale; too poor or already maxed out is refused, never charged.
 */
export function buyUpgrade(world, upgradeId) {
  const upgrade = UPGRADES.find((entry) => entry.id === upgradeId);
  if (!upgrade) return false;
  const level = world.upgrades[upgradeId] ?? 0;
  if (level >= upgrade.maxLevel) return false;
  const price = upgradePrice(upgrade, level);
  if (world.coins < price) return false;
  world.coins -= price;
  world.upgrades[upgradeId] = level + 1;
  if (upgradeId === 'heart') world.hearts += 1;
  return true;
}
