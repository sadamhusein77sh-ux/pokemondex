import { PokemonTypeRef } from './pokemon-type.model';
import { PokemonListItem } from './pokemon-list.model';

export type { PokemonTypeRef, PokemonListItem };
export { POKEMON_TYPE_ORDER, POKEMON_TYPE_HEX, isPokemonTypeName } from './pokemon-type.model';
export type { PokemonTypeName } from './pokemon-type.model';

export interface Pokemon {
  readonly id: number;
  readonly name: string;
  readonly imageUrl: string;
  readonly types: ReadonlyArray<PokemonTypeRef>;
}
