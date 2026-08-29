import { PokemonTypeRef } from './pokemon-type.model';

export interface PokemonListItem {
  readonly id: number;
  readonly name: string;
  readonly imageUrl: string;
  readonly types: ReadonlyArray<PokemonTypeRef>;
}

export interface PokemonListPage {
  readonly count: number;
  readonly nextOffset: number | null;
  readonly results: ReadonlyArray<PokemonListItem>;
}

export interface PokemonListQuery {
  readonly limit: number;
  readonly offset: number;
}
