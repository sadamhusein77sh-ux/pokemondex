import { Injectable, inject } from '@angular/core';
import { Observable, ReplaySubject, map, of } from 'rxjs';

import { FavoritesRepository } from '../../domain/repositories/favorites.repository';
import { IonicStorageService } from '../../infrastructure/storage/ionic-storage.service';

const FAVORITES_STORAGE_KEY = 'favorites';

@Injectable({ providedIn: 'root' })
export class FavoritesRepositoryImpl implements FavoritesRepository {
  private readonly storage = inject(IonicStorageService);
  private readonly subject = new ReplaySubject<ReadonlyArray<number>>(1);
  private current: ReadonlyArray<number> = [];
  private hydrated = false;

  loadFavorites(): Observable<ReadonlyArray<number>> {
    if (!this.hydrated) {
      this.hydrated = true;
      void this.hydrate();
    }
    return this.subject.asObservable();
  }

  addFavorite(id: number): Observable<ReadonlyArray<number>> {
    if (this.current.includes(id)) {
      return of([...this.current]);
    }
    const next = [...this.current, id];
    this.persist(next);
    return of([...next]);
  }

  removeFavorite(id: number): Observable<ReadonlyArray<number>> {
    if (!this.current.includes(id)) {
      return of([...this.current]);
    }
    const next = this.current.filter((existing) => existing !== id);
    this.persist(next);
    return of([...next]);
  }

  isFavorite(id: number): boolean {
    return this.current.includes(id);
  }

  watchFavorites(): Observable<ReadonlyArray<number>> {
    return this.loadFavorites().pipe(map((list) => [...list]));
  }

  private async hydrate(): Promise<void> {
    const raw = await this.storage.get(FAVORITES_STORAGE_KEY);
    const parsed = this.parse(raw);
    this.current = parsed;
    this.subject.next(parsed);
  }

  private persist(next: ReadonlyArray<number>): void {
    this.current = next;
    this.subject.next(next);
    void this.storage.set(FAVORITES_STORAGE_KEY, JSON.stringify(next));
  }

  private parse(raw: string | null): ReadonlyArray<number> {
    if (raw === null) {
      return [];
    }
    try {
      const value: unknown = JSON.parse(raw);
      if (!Array.isArray(value)) {
        return [];
      }
      return value.filter(
        (entry): entry is number => typeof entry === 'number' && Number.isFinite(entry),
      );
    } catch {
      return [];
    }
  }
}
