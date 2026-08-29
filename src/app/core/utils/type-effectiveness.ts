import { POKEMON_TYPE_ORDER, PokemonTypeName } from '../models/pokemon-type.model';

export type EffectivenessMultiplier = 0 | 0.25 | 0.5 | 1 | 2 | 4;

export type CoverageBucket =
  | 'immune'
  | 'quad-resist'
  | 'resist'
  | 'neutral'
  | 'weak'
  | 'quad-weak';

export interface TypeDefensiveCoverage {
  readonly immune: ReadonlyArray<PokemonTypeName>;
  readonly quadResist: ReadonlyArray<PokemonTypeName>;
  readonly resist: ReadonlyArray<PokemonTypeName>;
  readonly neutral: ReadonlyArray<PokemonTypeName>;
  readonly weak: ReadonlyArray<PokemonTypeName>;
  readonly quadWeak: ReadonlyArray<PokemonTypeName>;
}

const typeIndex = (type: PokemonTypeName): number =>
  (POKEMON_TYPE_ORDER as readonly PokemonTypeName[]).indexOf(type);

const RAW_EFFECTIVENESS: ReadonlyArray<ReadonlyArray<number>> = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0.5, 0, 1, 1, 0.5, 1],
  [1, 0.5, 0.5, 1, 2, 2, 1, 1, 1, 1, 1, 2, 0.5, 1, 0.5, 1, 2, 1],
  [1, 2, 0.5, 1, 0.5, 1, 1, 1, 2, 1, 1, 1, 2, 1, 0.5, 1, 1, 1],
  [1, 1, 2, 0.5, 0.5, 1, 1, 1, 0, 2, 1, 1, 1, 1, 0.5, 1, 1, 1],
  [1, 0.5, 2, 1, 0.5, 1, 1, 0.5, 2, 0.5, 1, 0.5, 2, 1, 0.5, 1, 0.5, 1],
  [1, 0.5, 0.5, 1, 2, 0.5, 1, 1, 2, 2, 1, 1, 1, 1, 2, 1, 0.5, 1],
  [2, 1, 1, 1, 1, 2, 1, 0.5, 1, 0.5, 0.5, 0.5, 2, 0, 1, 2, 2, 0.5],
  [1, 1, 1, 1, 2, 1, 1, 0.5, 0.5, 1, 1, 1, 0.5, 0.5, 1, 1, 0, 2],
  [1, 2, 1, 2, 0.5, 1, 1, 2, 1, 0, 1, 0.5, 2, 1, 1, 1, 2, 1],
  [1, 1, 1, 0.5, 2, 1, 2, 1, 1, 1, 1, 2, 0.5, 1, 1, 1, 0.5, 1],
  [1, 1, 1, 1, 1, 1, 2, 2, 1, 1, 0.5, 1, 1, 1, 1, 0, 0.5, 1],
  [1, 0.5, 1, 1, 2, 1, 0.5, 0.5, 1, 0.5, 2, 1, 1, 0.5, 1, 2, 0.5, 0.5],
  [1, 2, 1, 1, 1, 2, 0.5, 1, 0.5, 2, 1, 2, 1, 1, 1, 1, 0.5, 1],
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 0.5, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 0.5, 0],
  [1, 1, 1, 1, 1, 1, 0.5, 1, 1, 1, 2, 1, 1, 2, 1, 0.5, 1, 0.5],
  [1, 0.5, 0.5, 0.5, 1, 2, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 0.5, 2],
  [1, 0.5, 1, 1, 1, 1, 2, 0.5, 1, 1, 1, 1, 1, 1, 2, 2, 0.5, 1],
];

export function getOffensiveMultiplier(
  attacker: PokemonTypeName,
  defender: PokemonTypeName,
): EffectivenessMultiplier {
  const row = RAW_EFFECTIVENESS[typeIndex(attacker)];
  const value = row[typeIndex(defender)];
  return normalizeMultiplier(value);
}

export function getDefensiveMultiplier(
  defenderTypes: ReadonlyArray<PokemonTypeName>,
  attacker: PokemonTypeName,
): EffectivenessMultiplier {
  let multiplier = 1;
  for (const defender of defenderTypes) {
    const row = RAW_EFFECTIVENESS[typeIndex(attacker)];
    multiplier *= row[typeIndex(defender)];
  }
  return normalizeMultiplier(multiplier);
}

export function bucketFor(
  multiplier: EffectivenessMultiplier,
): CoverageBucket {
  if (multiplier === 0) {
    return 'immune';
  }
  if (multiplier === 0.25) {
    return 'quad-resist';
  }
  if (multiplier === 0.5) {
    return 'resist';
  }
  if (multiplier === 1) {
    return 'neutral';
  }
  if (multiplier === 2) {
    return 'weak';
  }
  return 'quad-weak';
}

export function computeTeamDefensiveCoverage(
  teams: ReadonlyArray<ReadonlyArray<PokemonTypeName>>,
): TypeDefensiveCoverage {
  const buckets: Record<CoverageBucket, PokemonTypeName[]> = {
    immune: [],
    'quad-resist': [],
    resist: [],
    neutral: [],
    weak: [],
    'quad-weak': [],
  };

  for (const attacker of POKEMON_TYPE_ORDER) {
    let worst: EffectivenessMultiplier = 1;
    let best: EffectivenessMultiplier = 1;
    for (const pokemonTypes of teams) {
      const mult = getDefensiveMultiplier(pokemonTypes, attacker);
      if (mult < worst) {
        worst = mult;
      }
      if (mult > best) {
        best = mult;
      }
    }
    assignToBucket(buckets, attacker, worst, best);
  }

  return {
    immune: buckets.immune,
    quadResist: buckets['quad-resist'],
    resist: buckets.resist,
    neutral: buckets.neutral,
    weak: buckets.weak,
    quadWeak: buckets['quad-weak'],
  };
}

function assignToBucket(
  buckets: Record<CoverageBucket, PokemonTypeName[]>,
  attacker: PokemonTypeName,
  worst: EffectivenessMultiplier,
  best: EffectivenessMultiplier,
): void {
  if (worst === 0) {
    buckets.immune.push(attacker);
    return;
  }
  if (best === 4) {
    buckets['quad-weak'].push(attacker);
    return;
  }
  if (best >= 2) {
    buckets.weak.push(attacker);
    return;
  }
  if (worst <= 0.25) {
    buckets['quad-resist'].push(attacker);
    return;
  }
  if (worst <= 0.5) {
    buckets.resist.push(attacker);
    return;
  }
  buckets.neutral.push(attacker);
}

function normalizeMultiplier(value: number): EffectivenessMultiplier {
  if (value === 0) {
    return 0;
  }
  if (value <= 0.25) {
    return 0.25;
  }
  if (value <= 0.5) {
    return 0.5;
  }
  if (value >= 4) {
    return 4;
  }
  if (value >= 2) {
    return 2;
  }
  return 1;
}
