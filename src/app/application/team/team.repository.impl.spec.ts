import { TestBed } from '@angular/core/testing';

import { TeamRepositoryImpl } from './team.repository.impl';
import {
  IonicStorageService,
  KeyValueStorage,
  LOCAL_STORAGE_BACKING,
} from '../../infrastructure/storage/ionic-storage.service';
import { TeamSlot, TEAM_MAX_SIZE } from '../../core/models/team.model';

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
}

describe('TeamRepositoryImpl', () => {
  let repo: TeamRepositoryImpl;
  let storage: FakeStorage;

  const firstTeam = (): Promise<ReadonlyArray<TeamSlot>> =>
    new Promise((resolve) => repo.loadTeam().subscribe((list) => resolve(list)));

  beforeEach(() => {
    storage = new FakeStorage();
    TestBed.configureTestingModule({
      providers: [
        { provide: LOCAL_STORAGE_BACKING, useValue: storage },
        IonicStorageService,
        TeamRepositoryImpl,
      ],
    });
    repo = TestBed.inject(TeamRepositoryImpl);
  });

  it('hydrates from storage on first load', async () => {
    const stored = [
      { index: 0, pokemonId: 25 },
      { index: 1, pokemonId: 6 },
    ];
    await storage.set('pokedex-mobile:team', JSON.stringify(stored));
    const result = await firstTeam();
    expect(result).toEqual(stored);
    expect(repo.snapshot().length).toBe(2);
  });

  it('adds a pokemon to the next empty slot and persists it', async () => {
    await firstTeam();
    const after = await new Promise<ReadonlyArray<TeamSlot>>((resolve) => {
      repo.addPokemon(25).subscribe((list) => resolve(list));
    });
    expect(after).toEqual([{ index: 0, pokemonId: 25 }]);
    expect(storage.store.get('pokedex-mobile:team')).toContain('"pokemonId":25');
  });

  it('rejects duplicates (same pokemon already in team)', async () => {
    await firstTeam();
    repo.addPokemon(25).subscribe();
    const after = await new Promise<ReadonlyArray<TeamSlot>>((resolve) => {
      repo.addPokemon(25).subscribe((list) => resolve(list));
    });
    expect(after.length).toBe(1);
  });

  it('caps the team at TEAM_MAX_SIZE members', async () => {
    await firstTeam();
    for (let id = 1; id <= TEAM_MAX_SIZE; id += 1) {
      await new Promise<void>((resolve) => {
        repo.addPokemon(id).subscribe(() => resolve());
      });
    }
    expect(repo.isFull()).toBe(true);
    const after = await new Promise<ReadonlyArray<TeamSlot>>((resolve) => {
      repo.addPokemon(99).subscribe((list) => resolve(list));
    });
    expect(after.length).toBe(TEAM_MAX_SIZE);
  });

  it('removes a pokemon from a slot and compacts remaining slots', async () => {
    await storage.set(
      'pokedex-mobile:team',
      JSON.stringify([
        { index: 0, pokemonId: 25 },
        { index: 1, pokemonId: 6 },
        { index: 2, pokemonId: 7 },
      ]),
    );
    await firstTeam();
    const after = await new Promise<ReadonlyArray<TeamSlot>>((resolve) => {
      repo.removePokemon(1).subscribe((list) => resolve(list));
    });
    expect(after).toEqual([
      { index: 0, pokemonId: 25 },
      { index: 1, pokemonId: 7 },
    ]);
  });

  it('swaps a pokemon in the requested slot when present', async () => {
    await storage.set(
      'pokedex-mobile:team',
      JSON.stringify([{ index: 0, pokemonId: 25 }]),
    );
    await firstTeam();
    const after = await new Promise<ReadonlyArray<TeamSlot>>((resolve) => {
      repo.swapPokemon(0, 6).subscribe((list) => resolve(list));
    });
    expect(after).toEqual([{ index: 0, pokemonId: 6 }]);
  });

  it('clears the team', async () => {
    await storage.set(
      'pokedex-mobile:team',
      JSON.stringify([{ index: 0, pokemonId: 25 }]),
    );
    await firstTeam();
    const after = await new Promise<ReadonlyArray<TeamSlot>>((resolve) => {
      repo.clearTeam().subscribe((list) => resolve(list));
    });
    expect(after).toEqual([]);
    expect(storage.store.get('pokedex-mobile:team')).toBe('[]');
  });

  it('treats malformed storage as an empty team', async () => {
    await storage.set('pokedex-mobile:team', '{not-json}');
    const result = await firstTeam();
    expect(result).toEqual([]);
  });

  it('drops unknown entries when parsing stored data', async () => {
    await storage.set(
      'pokedex-mobile:team',
      JSON.stringify([
        { index: 0, pokemonId: 25 },
        { index: 'oops' },
        { index: 1 },
        { index: 99, pokemonId: 6 },
      ]),
    );
    const result = await firstTeam();
    expect(result).toEqual([{ index: 0, pokemonId: 25 }]);
  });

  it('exposes a watch stream that replays the current team', async () => {
    const snapshot = await new Promise<ReadonlyArray<TeamSlot>>((resolve) => {
      repo.watchTeam().subscribe((list) => resolve(list));
    });
    expect(snapshot).toEqual([]);
  });
});
