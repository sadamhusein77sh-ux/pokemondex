import { PokemonTypeRef } from './pokemon-type.model';
import { PokemonListItem } from './pokemon-list.model';

export interface AbilityRef {
  readonly name: string;
  readonly isHidden: boolean;
}

export interface StatRef {
  readonly name: string;
  readonly baseValue: number;
}

export interface MoveRef {
  readonly name: string;
}

export interface PokemonDetail extends PokemonListItem {
  readonly height: number;
  readonly weight: number;
  readonly abilities: ReadonlyArray<AbilityRef>;
  readonly stats: ReadonlyArray<StatRef>;
  readonly moves: ReadonlyArray<MoveRef>;
  readonly spriteFallbacks: ReadonlyArray<string>;
}
