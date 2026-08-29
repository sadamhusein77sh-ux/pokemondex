import { Observable } from 'rxjs';

import { PokemonDetail } from '../../core/models/pokemon-detail.model';
import { PokemonListPage, PokemonListQuery } from '../../core/models/pokemon-list.model';
import { PokemonTypeName } from '../../core/models/pokemon-type.model';

export abstract class PokemonRepository {
  abstract listPokemon(query: PokemonListQuery): Observable<PokemonListPage>;
  abstract getPokemonDetail(idOrName: number | string): Observable<PokemonDetail>;
  abstract listByType(typeName: PokemonTypeName): Observable<PokemonListPage>;
}
