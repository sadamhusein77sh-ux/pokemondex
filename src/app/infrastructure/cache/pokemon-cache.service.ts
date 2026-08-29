import { Injectable } from '@angular/core';

import { PokemonDetail } from '../../core/models/pokemon-detail.model';

interface CacheEntry<T> {
  readonly value: T;
  readonly insertedAt: number;
}

export interface PokemonCacheStats {
  readonly size: number;
  readonly capacity: number;
  readonly hits: number;
  readonly misses: number;
}

const DEFAULT_CAPACITY = 100;

@Injectable({ providedIn: 'root' })
export class PokemonCacheService {
  private readonly capacity: number;
  private readonly entries = new Map<number, CacheEntry<PokemonDetail>>();
  private hits = 0;
  private misses = 0;

  constructor() {
    this.capacity = DEFAULT_CAPACITY;
  }

  get(id: number): PokemonDetail | null {
    const entry = this.entries.get(id);
    if (entry === undefined) {
      this.misses += 1;
      return null;
    }
    this.entries.delete(id);
    this.entries.set(id, { ...entry, insertedAt: Date.now() });
    this.hits += 1;
    return entry.value;
  }

  set(id: number, detail: PokemonDetail): void {
    if (this.entries.has(id)) {
      this.entries.delete(id);
    } else if (this.entries.size >= this.capacity) {
      this.evictOldest();
    }
    this.entries.set(id, { value: detail, insertedAt: Date.now() });
  }

  has(id: number): boolean {
    return this.entries.has(id);
  }

  clear(): void {
    this.entries.clear();
    this.hits = 0;
    this.misses = 0;
  }

  stats(): PokemonCacheStats {
    return {
      size: this.entries.size,
      capacity: this.capacity,
      hits: this.hits,
      misses: this.misses,
    };
  }

  private evictOldest(): void {
    let oldestKey: number | null = null;
    let oldestAt = Number.POSITIVE_INFINITY;
    for (const [key, entry] of this.entries) {
      if (entry.insertedAt < oldestAt) {
        oldestAt = entry.insertedAt;
        oldestKey = key;
      }
    }
    if (oldestKey !== null) {
      this.entries.delete(oldestKey);
    }
  }
}
