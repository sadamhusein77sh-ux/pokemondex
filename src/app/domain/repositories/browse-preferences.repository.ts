import { Observable } from 'rxjs';

import { PokemonTypeName } from '../../core/models/pokemon-type.model';

export type SortMode = 'id' | 'name';

export abstract class BrowsePreferencesRepository {
  abstract loadTypeFilter(): Observable<PokemonTypeName | null>;
  abstract saveTypeFilter(
    type: PokemonTypeName | null,
  ): Observable<PokemonTypeName | null>;
  abstract loadSortMode(): Observable<SortMode>;
  abstract saveSortMode(mode: SortMode): Observable<SortMode>;
}
