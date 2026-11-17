// A small seeded random source (mulberry32) so a screenshot scene staged
// with ?seed=N always plays out the same way, while a real game rolls a
// fresh seed. Every random choice in the game goes through this one object.

/** Create a random source from a 32-bit integer seed. */
export function createRandom(seed) {
  let state = seed >>> 0;
  return {
    /** Next float in [0, 1). */
    next() {
      state = (state + 0x6d2b79f5) >>> 0;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    /** Integer in [min, max], inclusive. */
    int(min, max) {
      return min + Math.floor(this.next() * (max - min + 1));
    },
    /** Float in [min, max). */
    range(min, max) {
      return min + this.next() * (max - min);
    },
    /** One element of an array, uniformly. */
    pick(items) {
      return items[Math.floor(this.next() * items.length)];
    },
    /** True with probability p. */
    chance(p) {
      return this.next() < p;
    },
  };
}
