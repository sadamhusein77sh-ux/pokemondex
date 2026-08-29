import { PokemonCacheService } from './pokemon-cache.service';
import { PokemonDetail } from '../../core/models/pokemon-detail.model';

const sample = (id: number): PokemonDetail => ({
  id,
  name: `pokemon-${id}`,
  imageUrl: `https://example.test/${id}.png`,
  types: [{ name: 'normal', url: '' }],
  height: 1,
  weight: 1,
  abilities: [],
  stats: [],
  moves: [],
  spriteFallbacks: [],
});

describe('PokemonCacheService', () => {
  let service: PokemonCacheService;

  beforeEach(() => {
    service = new PokemonCacheService();
  });

  it('stores and returns a detail by id', () => {
    const detail = sample(1);
    service.set(1, detail);

    expect(service.has(1)).toBe(true);
    expect(service.get(1)).toBe(detail);
  });

  it('returns null and counts a miss for unknown ids', () => {
    expect(service.get(99)).toBeNull();
    expect(service.stats().misses).toBe(1);
  });

  it('counts hits on successful reads', () => {
    service.set(1, sample(1));
    service.get(1);
    service.get(1);

    expect(service.stats().hits).toBe(2);
  });

  it('overwrites a duplicate key without growing capacity', () => {
    for (let i = 0; i < 100; i += 1) {
      service.set(i + 1, sample(i + 1));
    }
    service.set(1, sample(1));
    expect(service.stats().size).toBe(100);
    expect(service.get(1)).toEqual(sample(1));
  });

  it('evicts the oldest entry once capacity is exceeded', () => {
    for (let i = 0; i < 100; i += 1) {
      service.set(i + 1, sample(i + 1));
    }
    service.set(101, sample(101));

    expect(service.stats().size).toBe(100);
    expect(service.has(101)).toBe(true);
    expect(service.has(1)).toBe(false);
  });

  it('refreshes recency on read for LRU semantics', () => {
    for (let i = 0; i < 100; i += 1) {
      service.set(i + 1, sample(i + 1));
    }
    service.get(1);
    service.set(101, sample(101));

    expect(service.has(1)).toBe(true);
    expect(service.has(2)).toBe(false);
  });

  it('clears the cache and resets stats', () => {
    service.set(1, sample(1));
    service.get(1);
    service.clear();

    expect(service.stats()).toEqual({
      size: 0,
      capacity: 100,
      hits: 0,
      misses: 0,
    });
  });
});
