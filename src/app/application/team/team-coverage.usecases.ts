import { Injectable } from '@angular/core';

import { PokemonDetail } from '../../core/models/pokemon-detail.model';
import { TeamStatTotals } from '../../core/models/team.model';
import { PokemonTypeName } from '../../core/models/pokemon-type.model';
import {
  computeTeamDefensiveCoverage,
  TypeDefensiveCoverage,
} from '../../core/utils/type-effectiveness';
import {
  CANONICAL_STAT_ORDER,
  toCanonicalStatName,
} from '../../core/utils/stat-name.mapper';

interface StatAccumulator {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
}

const ZERO_STATS: StatAccumulator = {
  hp: 0,
  attack: 0,
  defense: 0,
  specialAttack: 0,
  specialDefense: 0,
  speed: 0,
};

@Injectable({ providedIn: 'root' })
export class ComputeTeamTypeCoverageUseCase {
  execute(
    teams: ReadonlyArray<ReadonlyArray<PokemonTypeName>>,
  ): TypeDefensiveCoverage {
    return computeTeamDefensiveCoverage(teams);
  }
}

@Injectable({ providedIn: 'root' })
export class ComputeTeamStatsUseCase {
  execute(details: ReadonlyArray<PokemonDetail>): TeamStatTotals {
    const accumulator: StatAccumulator = { ...ZERO_STATS };
    let total = 0;
    for (const detail of details) {
      for (const stat of detail.stats) {
        const canonical = toCanonicalStatName(stat.name);
        if (canonical === null) {
          continue;
        }
        accumulator[statKeyFor(canonical)] += stat.baseValue;
        total += stat.baseValue;
      }
    }
    return {
      hp: accumulator.hp,
      attack: accumulator.attack,
      defense: accumulator.defense,
      specialAttack: accumulator.specialAttack,
      specialDefense: accumulator.specialDefense,
      speed: accumulator.speed,
      total,
    };
  }
}

function statKeyFor(
  canonical: (typeof CANONICAL_STAT_ORDER)[number],
): keyof StatAccumulator {
  switch (canonical) {
    case 'hp':
      return 'hp';
    case 'attack':
      return 'attack';
    case 'defense':
      return 'defense';
    case 'special-attack':
      return 'specialAttack';
    case 'special-defense':
      return 'specialDefense';
    case 'speed':
      return 'speed';
  }
}
