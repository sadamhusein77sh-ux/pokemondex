import { TestBed } from '@angular/core/testing';

import { IonicStorageService, KeyValueStorage, LOCAL_STORAGE_BACKING } from './ionic-storage.service';

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
}

class ThrowingStorage implements KeyValueStorage {
  async get(): Promise<string | null> {
    throw new Error('quota');
  }
  async set(): Promise<void> {
    throw new Error('quota');
  }
  async remove(): Promise<void> {
    throw new Error('quota');
  }
}

describe('IonicStorageService', () => {
  it('persists values under a namespaced key', async () => {
    const fake = new FakeStorage();
    TestBed.configureTestingModule({
      providers: [
        { provide: LOCAL_STORAGE_BACKING, useValue: fake },
        IonicStorageService,
      ],
    });
    const service = TestBed.inject(IonicStorageService);

    await service.set('favorites', '[1,2,3]');
    expect(fake.has('pokedex-mobile:favorites')).toBe(true);
    expect(await service.get('favorites')).toBe('[1,2,3]');
  });

  it('returns null for missing keys', async () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: LOCAL_STORAGE_BACKING, useClass: FakeStorage },
        IonicStorageService,
      ],
    });
    const service = TestBed.inject(IonicStorageService);

    expect(await service.get('missing')).toBeNull();
  });

  it('removes values', async () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: LOCAL_STORAGE_BACKING, useClass: FakeStorage },
        IonicStorageService,
      ],
    });
    const service = TestBed.inject(IonicStorageService);

    await service.set('favorites', '[]');
    await service.remove('favorites');
    expect(await service.get('favorites')).toBeNull();
  });

  it('degrades gracefully when storage throws', async () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: LOCAL_STORAGE_BACKING, useClass: ThrowingStorage },
        IonicStorageService,
      ],
    });
    const service = TestBed.inject(IonicStorageService);

    await expect(service.set('k', 'v')).resolves.toBeUndefined();
    await expect(service.get('k')).resolves.toBeNull();
    await expect(service.remove('k')).resolves.toBeUndefined();
  });
});
