import { Injectable, inject } from '@angular/core';
import { Observable, ReplaySubject, map, of } from 'rxjs';

import { TeamSlot, TEAM_MAX_SIZE } from '../../core/models/team.model';
import { TeamRepository } from '../../domain/repositories/team.repository';
import { IonicStorageService } from '../../infrastructure/storage/ionic-storage.service';

const TEAM_STORAGE_KEY = 'team';

@Injectable({ providedIn: 'root' })
export class TeamRepositoryImpl implements TeamRepository {
  private readonly storage = inject(IonicStorageService);
  private readonly subject = new ReplaySubject<ReadonlyArray<TeamSlot>>(1);
  private current: ReadonlyArray<TeamSlot> = [];
  private hydrated = false;

  loadTeam(): Observable<ReadonlyArray<TeamSlot>> {
    if (!this.hydrated) {
      this.hydrated = true;
      void this.hydrate();
    }
    return this.subject.asObservable();
  }

  addPokemon(pokemonId: number): Observable<ReadonlyArray<TeamSlot>> {
    if (this.current.some((slot) => slot.pokemonId === pokemonId)) {
      return of([...this.current]);
    }
    const nextIndex = this.nextEmptyIndex();
    if (nextIndex === null) {
      return of([...this.current]);
    }
    const next = [...this.current, { index: nextIndex, pokemonId }];
    this.persist(next);
    return of([...next]);
  }

  removePokemon(slotIndex: number): Observable<ReadonlyArray<TeamSlot>> {
    const filtered = this.current
      .filter((slot) => slot.index !== slotIndex)
      .map((slot, position) => ({ ...slot, index: position }));
    if (filtered.length === this.current.length) {
      return of([...this.current]);
    }
    this.persist(filtered);
    return of([...filtered]);
  }

  swapPokemon(
    slotIndex: number,
    pokemonId: number,
  ): Observable<ReadonlyArray<TeamSlot>> {
    if (slotIndex < 0 || slotIndex >= TEAM_MAX_SIZE) {
      return of([...this.current]);
    }
    const existing = this.current.find((slot) => slot.index === slotIndex);
    if (existing === undefined) {
      const appended = [...this.current, { index: slotIndex, pokemonId }]
        .slice(0, TEAM_MAX_SIZE)
        .map((slot, position) => ({ ...slot, index: position }));
      this.persist(appended);
      return of([...appended]);
    }
    if (this.current.some((slot) => slot.pokemonId === pokemonId && slot.index !== slotIndex)) {
      return of([...this.current]);
    }
    const next = this.current.map((slot) =>
      slot.index === slotIndex ? { ...slot, pokemonId } : slot,
    );
    this.persist(next);
    return of([...next]);
  }

  clearTeam(): Observable<ReadonlyArray<TeamSlot>> {
    if (this.current.length === 0) {
      return of([]);
    }
    this.persist([]);
    return of([]);
  }

  watchTeam(): Observable<ReadonlyArray<TeamSlot>> {
    return this.loadTeam().pipe(map((slots) => [...slots]));
  }

  snapshot(): ReadonlyArray<TeamSlot> {
    return [...this.current];
  }

  isFull(): boolean {
    return this.current.length >= TEAM_MAX_SIZE;
  }

  private nextEmptyIndex(): number | null {
    const used = new Set(this.current.map((slot) => slot.index));
    for (let i = 0; i < TEAM_MAX_SIZE; i += 1) {
      if (!used.has(i)) {
        return i;
      }
    }
    return null;
  }

  private async hydrate(): Promise<void> {
    const raw = await this.storage.get(TEAM_STORAGE_KEY);
    const parsed = this.parse(raw);
    this.current = parsed;
    this.subject.next(parsed);
  }

  private persist(next: ReadonlyArray<TeamSlot>): void {
    this.current = next;
    this.subject.next(next);
    void this.storage.set(TEAM_STORAGE_KEY, JSON.stringify(next));
  }

  private parse(raw: string | null): ReadonlyArray<TeamSlot> {
    if (raw === null) {
      return [];
    }
    try {
      const value: unknown = JSON.parse(raw);
      if (!Array.isArray(value)) {
        return [];
      }
      const sanitized: TeamSlot[] = [];
      for (const entry of value) {
        if (
          entry !== null &&
          typeof entry === 'object' &&
          'pokemonId' in entry &&
          'index' in entry
        ) {
          const pokemonId = (entry as { pokemonId: unknown }).pokemonId;
          const index = (entry as { index: unknown }).index;
          if (
            typeof pokemonId === 'number' &&
            Number.isFinite(pokemonId) &&
            typeof index === 'number' &&
            Number.isInteger(index) &&
            index >= 0 &&
            index < TEAM_MAX_SIZE &&
            !sanitized.some((slot) => slot.index === index)
          ) {
            sanitized.push({ index, pokemonId });
          }
        }
      }
      return sanitized
        .slice()
        .sort((a, b) => a.index - b.index)
        .map((slot, position) => ({ ...slot, index: position }));
    } catch {
      return [];
    }
  }
}
