import { Injectable, inject } from '@angular/core';
import { Observable, distinctUntilChanged, map, shareReplay } from 'rxjs';

import { FavoritesRepository } from '../../domain/repositories/favorites.repository';

@Injectable({ providedIn: 'root' })
export class GetFavoritesUseCase {
  private readonly repository = inject(FavoritesRepository);

  execute(): Observable<ReadonlyArray<number>> {
    return this.repository
      .loadFavorites()
      .pipe(distinctUntilChanged(), map((list) => [...list]), shareReplay({ bufferSize: 1, refCount: true }));
  }
}

@Injectable({ providedIn: 'root' })
export class IsFavoriteUseCase {
  private readonly repository = inject(FavoritesRepository);

  execute(id: number): Observable<boolean> {
    return this.repository
      .loadFavorites()
      .pipe(map((list) => list.includes(id)), distinctUntilChanged());
  }

  snapshot(id: number): boolean {
    return this.repository.isFavorite(id);
  }
}

@Injectable({ providedIn: 'root' })
export class ToggleFavoriteUseCase {
  private readonly repository = inject(FavoritesRepository);

  execute(id: number): Observable<ReadonlyArray<number>> {
    if (this.repository.isFavorite(id)) {
      return this.repository.removeFavorite(id);
    }
    return this.repository.addFavorite(id);
  }

  add(id: number): Observable<ReadonlyArray<number>> {
    return this.repository.addFavorite(id);
  }

  remove(id: number): Observable<ReadonlyArray<number>> {
    return this.repository.removeFavorite(id);
  }
}
