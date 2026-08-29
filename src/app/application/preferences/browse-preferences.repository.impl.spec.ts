import { TestBed } from '@angular/core/testing';

import { BrowsePreferencesRepositoryImpl } from './browse-preferences.repository.impl';
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

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  dispatchStorageEvent(key: string, newValue: string | null): void {
    if (newValue === null) {
      this.store.delete(key);
    } else {
      this.store.set(key, newValue);
    }
    const event = new Event('storage');
    Object.defineProperty(event, 'key', { value: key });
    Object.defineProperty(event, 'newValue', { value: newValue });
    globalThis.dispatchEvent(event);
  }
}

const TYPE_KEY = 'pokedex-mobile:browse:type-filter';
const SORT_KEY = 'pokedex-mobile:browse:sort-mode';

describe('BrowsePreferencesRepositoryImpl', () => {
  let repo: BrowsePreferencesRepositoryImpl;
  let storage: FakeStorage;

  beforeEach(() => {
    storage = new FakeStorage();
    TestBed.configureTestingModule({
      providers: [
        { provide: LOCAL_STORAGE_BACKING, useValue: storage },
        IonicStorageService,
        BrowsePreferencesRepositoryImpl,
      ],
    });
    repo = TestBed.inject(BrowsePreferencesRepositoryImpl);
  });

  describe('type filter', () => {
    it('emits null when no filter is persisted', async () => {
      const value = await firstEmitted(repo.loadTypeFilter());
      expect(value).toBeNull();
    });

    it('emits the persisted type filter on load', async () => {
      await storage.set(TYPE_KEY, 'fire');
      const value = await firstEmitted(repo.loadTypeFilter());
      expect(value).toBe('fire');
    });

    it('falls back to null for unknown persisted values', async () => {
      await storage.set(TYPE_KEY, 'not-a-real-type');
      const value = await firstEmitted(repo.loadTypeFilter());
      expect(value).toBeNull();
    });

    it('persists the filter when saveTypeFilter is called', async () => {
      await firstEmitted(repo.loadTypeFilter());
      repo.saveTypeFilter('water').subscribe();
      expect(storage.getItem(TYPE_KEY)).toBe('water');
    });

    it('removes the storage entry when the filter is cleared', async () => {
      await storage.set(TYPE_KEY, 'fire');
      await firstEmitted(repo.loadTypeFilter());

      repo.saveTypeFilter(null).subscribe();

      expect(storage.store.has(TYPE_KEY)).toBe(false);
    });

    it('emits the new value to late subscribers after a save', async () => {
      await firstEmitted(repo.loadTypeFilter());
      repo.saveTypeFilter('grass').subscribe();

      const value = await firstEmitted(repo.loadTypeFilter());
      expect(value).toBe('grass');
    });
  });

  describe('sort mode', () => {
    it('defaults to id when no value is persisted', async () => {
      const value = await firstEmitted(repo.loadSortMode());
      expect(value).toBe('id');
    });

    it('emits the persisted sort mode on load', async () => {
      await storage.set(SORT_KEY, 'name');
      const value = await firstEmitted(repo.loadSortMode());
      expect(value).toBe('name');
    });

    it('falls back to id for unknown persisted values', async () => {
      await storage.set(SORT_KEY, 'random');
      const value = await firstEmitted(repo.loadSortMode());
      expect(value).toBe('id');
    });

    it('persists the sort mode when saveSortMode is called', async () => {
      await firstEmitted(repo.loadSortMode());
      repo.saveSortMode('name').subscribe();
      expect(storage.getItem(SORT_KEY)).toBe('name');
    });
  });

  describe('cross-tab sync', () => {
    it('re-emits the type filter when another tab writes to the type key', async () => {
      await firstEmitted(repo.loadTypeFilter());
      storage.dispatchStorageEvent(TYPE_KEY, 'rock');

      const value = await waitForValue(repo.loadTypeFilter(), (v) => v === 'rock');
      expect(value).toBe('rock');
    });

    it('re-emits the sort mode when another tab writes to the sort key', async () => {
      await firstEmitted(repo.loadSortMode());
      storage.dispatchStorageEvent(SORT_KEY, 'name');

      const value = await waitForValue(repo.loadSortMode(), (v) => v === 'name');
      expect(value).toBe('name');
    });

    it('clears the filter when another tab removes the key', async () => {
      await storage.set(TYPE_KEY, 'fire');
      await firstEmitted(repo.loadTypeFilter());

      storage.dispatchStorageEvent(TYPE_KEY, null);

      const value = await waitForValue(repo.loadTypeFilter(), (v) => v === null);
      expect(value).toBeNull();
    });

    it('ignores storage events for unrelated keys', async () => {
      await firstEmitted(repo.loadTypeFilter());
      let latest: string | null = 'baseline';
      const subscription = repo.loadTypeFilter().subscribe((v) => {
        latest = v;
      });
      await Promise.resolve();
      const before = latest;

      storage.dispatchStorageEvent('pokedex-mobile:other-key', 'whatever');

      await new Promise((resolve) => setTimeout(resolve, 30));
      expect(latest).toBe(before);
      subscription.unsubscribe();
    });
  });
});

function firstEmitted<T>(observable: import('rxjs').Observable<T>): Promise<T> {
  return new Promise<T>((resolve) => {
    observable.subscribe({
      next: (value) => resolve(value),
      error: (err) => resolve(err as T),
    });
  });
}

async function waitForValue<T>(
  source: import('rxjs').Observable<T>,
  predicate: (value: T) => boolean,
  timeoutMs = 200,
): Promise<T | null> {
  return new Promise<T | null>((resolve) => {
    let subscription: import('rxjs').Subscription | undefined;
    const timer = setTimeout(() => {
      subscription?.unsubscribe();
      resolve(null);
    }, timeoutMs);
    subscription = source.subscribe((value) => {
      if (predicate(value)) {
        clearTimeout(timer);
        subscription?.unsubscribe();
        resolve(value);
      }
    });
  });
}
