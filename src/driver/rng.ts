/** A seeded source of numbers in [0, 1): the same seed yields the same sequence. */
export type Rng = { next(): number };

/** A 32-bit generator (mulberry32) started from `seed`. */
export function seeded(seed: number): Rng {
  let state = seed >>> 0;
  return {
    next: () => {
      state = (state + 0x6d2b79f5) >>> 0;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
  };
}

/** One of `options`, drawn uniformly; `options` must not be empty. */
export function pick<T>(rng: Rng, options: readonly T[]): T {
  const chosen = options[Math.floor(rng.next() * options.length)];
  if (chosen === undefined) throw new Error("pick from no options");
  return chosen;
}

/** True with probability `p`. */
export function chance(rng: Rng, p: number): boolean {
  return rng.next() < p;
}
