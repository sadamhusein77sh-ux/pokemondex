import { TestBed } from '@angular/core/testing';

import {
  ComputeTeamStatsUseCase,
  ComputeTeamTypeCoverageUseCase,
} from './team-coverage.usecases';
import { PokemonDetail } from '../../core/models/pokemon-detail.model';

const detailWith = (
  id: number,
  types: ReadonlyArray<string>,
  stats: ReadonlyMap<string, number>,
): PokemonDetail => ({
  id,
  name: `pokemon-${id}`,
  imageUrl: `https://example.test/${id}.png`,
  types: types.map((name) => ({ name: name as never, url: 'u' })),
  height: 10,
  weight: 100,
  abilities: [],
  stats: Array.from(stats.entries()).map(([name, baseValue]) => ({ name, baseValue })),
  moves: [],
  spriteFallbacks: [],
});

describe('ComputeTeamTypeCoverageUseCase', () => {
  let useCase: ComputeTeamTypeCoverageUseCase;

  beforeEach(() => {
    useCase = TestBed.inject(ComputeTeamTypeCoverageUseCase);
  });

  it('returns zero coverage for an empty team', () => {
    const coverage = useCase.execute([]);
    expect(coverage.resist.length).toBe(0);
    expect(coverage.weak.length).toBe(0);
    expect(coverage.quadResist.length).toBe(0);
  });

  it('classifies Water as a weakness for a Fire-only team', () => {
    const coverage = useCase.execute([['fire']]);
    expect(coverage.weak).toContain('water');
    expect(coverage.weak).toContain('ground');
    expect(coverage.resist).toContain('grass');
    expect(coverage.resist).toContain('bug');
  });
});

describe('ComputeTeamStatsUseCase', () => {
  let useCase: ComputeTeamStatsUseCase;

  beforeEach(() => {
    useCase = TestBed.inject(ComputeTeamStatsUseCase);
  });

  it('returns all zeros for an empty team', () => {
    const totals = useCase.execute([]);
    expect(totals.hp).toBe(0);
    expect(totals.total).toBe(0);
  });

  it('sums stats across team members', () => {
    const stats1 = new Map<string, number>([
      ['hp', 100],
      ['attack', 50],
    ]);
    const stats2 = new Map<string, number>([
      ['hp', 70],
      ['attack', 30],
      ['speed', 90],
    ]);
    const detail1 = detailWith(1, ['fire'], stats1);
    const detail2 = detailWith(2, ['water'], stats2);
    const totals = useCase.execute([detail1, detail2]);
    expect(totals.hp).toBe(170);
    expect(totals.attack).toBe(80);
    expect(totals.speed).toBe(90);
    expect(totals.total).toBe(340);
  });

  it('ignores unknown stat names', () => {
    const stats = new Map<string, number>([
      ['hp', 80],
      ['unknown-stat', 999],
    ]);
    const totals = useCase.execute([detailWith(1, ['fire'], stats)]);
    expect(totals.hp).toBe(80);
    expect(totals.total).toBe(80);
  });
});
