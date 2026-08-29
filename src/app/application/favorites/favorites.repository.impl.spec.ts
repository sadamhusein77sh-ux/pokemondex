import { TestBed } from '@angular/core/testing';

import { FavoritesRepositoryImpl } from './favorites.repository.impl';
import {
  IonicStorageService,
  KeyValueStorage,
  LOCAL_STORAGE_BACKING,
} from '../../infrastructure/storage/ionic-storage.service';

class FakeStorage implements KeyValueStorage {
  store = new Map<string, string>();

  async get(key: string): Promise<string | null> {
    return this.store.has(key) ? (this.store.get(key) as string) : null;
  }

  async set(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  async remove(key: string): Promise<void> {
    this.store.delete(key);
  }

  has(key: string): boolean {
    return this.store.has(key);
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }
}

describe('FavoritesRepositoryImpl', () => {
  let repo: FavoritesRepositoryImpl;
  let storage: FakeStorage;

  beforeEach(() => {
    storage = new FakeStorage();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: LOCAL_STORAGE_BACKING,
          useValue: storage,
        },
        IonicStorageService,
        FavoritesRepositoryImpl,
      ],
    });
    repo = TestBed.inject(FavoritesRepositoryImpl);
  });

  it('hydrates from storage on first load', async () => {
    await storage.set('pokedex-mobile:favorites', JSON.stringify([3, 7]));

    const result = await new Promise<ReadonlyArray<number>>((resolve) => {
      repo.loadFavorites().subscribe((list) => resolve(list));
    });

    expect(result).toEqual([3, 7]);
    expect(repo.isFavorite(3)).toBe(true);
    expect(repo.isFavorite(7)).toBe(true);
  });

  it('adds favorites and persists them', async () => {
    const after = await new Promise<ReadonlyArray<number>>((resolve) => {
      repo.loadFavorites().subscribe(() => {
        repo.addFavorite(1).subscribe((list) => resolve(list));
      });
    });

    expect(after).toEqual([1]);
    expect(storage.getItem('pokedex-mobile:favorites')).toBe('[1]');
  });

  it('removes favorites and persists them', async () => {
    await storage.set('pokedex-mobile:favorites', JSON.stringify([1, 2]));

    const after = await new Promise<ReadonlyArray<number>>((resolve) => {
      repo.loadFavorites().subscribe((list) => {
        if (list.length === 2) {
          repo.removeFavorite(1).subscribe((next) => resolve(next));
        }
      });
    });

    expect(after).toEqual([2]);
    expect(storage.getItem('pokedex-mobile:favorites')).toBe('[2]');
  });

  it('treats malformed storage as an empty list', async () => {
    await storage.set('pokedex-mobile:favorites', '{not-json}');

    const result = await new Promise<ReadonlyArray<number>>((resolve) => {
      repo.loadFavorites().subscribe((list) => resolve(list));
    });

    expect(result).toEqual([]);
  });

  it('exposes a watch stream that replays the current list', async () => {
    const snapshot = await new Promise<ReadonlyArray<number>>((resolve) => {
      repo.watchFavorites().subscribe((list) => resolve(list));
    });
    expect(snapshot).toEqual([]);
  });
});
