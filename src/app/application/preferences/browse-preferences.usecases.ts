import { Injectable, inject } from '@angular/core';
import { Observable, distinctUntilChanged, shareReplay } from 'rxjs';

import {
  BrowsePreferencesRepository,
  SortMode,
} from '../../domain/repositories/browse-preferences.repository';
import { PokemonTypeName } from '../../core/models/pokemon-type.model';

@Injectable({ providedIn: 'root' })
export class GetTypeFilterUseCase {
  private readonly repository = inject(BrowsePreferencesRepository);

  execute(): Observable<PokemonTypeName | null> {
    return this.repository
      .loadTypeFilter()
      .pipe(
        distinctUntilChanged(),
        shareReplay({ bufferSize: 1, refCount: true }),
      );
  }
}

@Injectable({ providedIn: 'root' })
export class SetTypeFilterUseCase {
  private readonly repository = inject(BrowsePreferencesRepository);

  execute(type: PokemonTypeName | null): Observable<PokemonTypeName | null> {
    return this.repository.saveTypeFilter(type);
  }
}

@Injectable({ providedIn: 'root' })
export class GetSortModeUseCase {
  private readonly repository = inject(BrowsePreferencesRepository);

  execute(): Observable<SortMode> {
    return this.repository
      .loadSortMode()
      .pipe(
        distinctUntilChanged(),
        shareReplay({ bufferSize: 1, refCount: true }),
      );
  }
}

@Injectable({ providedIn: 'root' })
export class SetSortModeUseCase {
  private readonly repository = inject(BrowsePreferencesRepository);

  execute(mode: SortMode): Observable<SortMode> {
    return this.repository.saveSortMode(mode);
  }
}
