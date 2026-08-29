import {
  bucketFor,
  computeTeamDefensiveCoverage,
  getDefensiveMultiplier,
  getOffensiveMultiplier,
} from './type-effectiveness';
import { PokemonTypeName } from '../models/pokemon-type.model';

describe('type-effectiveness', () => {
  describe('getOffensiveMultiplier', () => {
    it('reports 0 for Normal attacking Ghost', () => {
      expect(getOffensiveMultiplier('normal', 'ghost')).toBe(0);
    });

    it('reports 2 for Water attacking Fire', () => {
      expect(getOffensiveMultiplier('water', 'fire')).toBe(2);
    });

    it('reports 0.5 for Fire attacking Water', () => {
      expect(getOffensiveMultiplier('fire', 'water')).toBe(0.5);
    });

    it('reports 1 for neutral matchups', () => {
      expect(getOffensiveMultiplier('normal', 'fire')).toBe(1);
    });
  });

  describe('getDefensiveMultiplier', () => {
    it('computes a 4x weakness for Ice/Steel defending against Fire', () => {
      expect(getDefensiveMultiplier(['ice', 'steel'], 'fire')).toBe(4);
    });

    it('computes a 0.25 quad-resist for Water/Grass defending against Water', () => {
      expect(getDefensiveMultiplier(['water', 'grass'], 'water')).toBe(0.25);
    });

    it('computes 0 immunity for Fairy defending against Dragon', () => {
      expect(getDefensiveMultiplier(['fairy'], 'dragon')).toBe(0);
    });

    it('returns 1 for normal defending against rock', () => {
      expect(getDefensiveMultiplier(['normal'], 'rock')).toBe(1);
    });
  });

  describe('bucketFor', () => {
    const cases: Array<[number, string]> = [
      [0, 'immune'],
      [0.25, 'quad-resist'],
      [0.5, 'resist'],
      [1, 'neutral'],
      [2, 'weak'],
      [4, 'quad-weak'],
    ];

    it.each(cases)('maps multiplier %s to bucket %s', (multiplier, expected) => {
      expect(bucketFor(multiplier as 0 | 0.25 | 0.5 | 1 | 2 | 4)).toBe(expected);
    });
  });

  describe('computeTeamDefensiveCoverage', () => {
    const allTypes: ReadonlyArray<PokemonTypeName> = [
      'normal',
      'fire',
      'water',
      'electric',
      'grass',
      'ice',
      'fighting',
      'poison',
      'ground',
      'flying',
      'psychic',
      'bug',
      'rock',
      'ghost',
      'dragon',
      'dark',
      'steel',
      'fairy',
    ];

    const collectedTypes = (coverage: ReturnType<typeof computeTeamDefensiveCoverage>): Set<PokemonTypeName> =>
      new Set([
        ...coverage.immune,
        ...coverage.quadResist,
        ...coverage.resist,
        ...coverage.neutral,
        ...coverage.weak,
        ...coverage.quadWeak,
      ]);

    it('classifies every type even for an empty team', () => {
      const coverage = computeTeamDefensiveCoverage([]);
      expect(collectedTypes(coverage).size).toBe(allTypes.length);
      expect(coverage.resist.length).toBe(0);
      expect(coverage.weak.length).toBe(0);
    });

    it('marks Water as a weakness for a single Fire type', () => {
      const coverage = computeTeamDefensiveCoverage([['fire']]);
      expect(coverage.weak).toContain('water');
    });

    it('marks Ground and Rock as weak for a single Fire type', () => {
      const coverage = computeTeamDefensiveCoverage([['fire']]);
      expect(coverage.weak).toContain('ground');
      expect(coverage.weak).toContain('rock');
    });

    it('marks Grass, Bug, and Ice as resisted by a single Fire type', () => {
      const coverage = computeTeamDefensiveCoverage([['fire']]);
      expect(coverage.resist).toContain('grass');
      expect(coverage.resist).toContain('bug');
      expect(coverage.resist).toContain('ice');
    });

    it('marks a type as immune when at least one team member has a 0x matchup', () => {
      const coverage = computeTeamDefensiveCoverage([
        ['normal'],
        ['ghost'],
      ]);
      expect(coverage.immune).toContain('ghost');
      expect(coverage.immune).toContain('normal');
    });
  });
});
