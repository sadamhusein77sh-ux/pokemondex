import { PokemonTypeName } from './pokemon-type.model';

export const TEAM_MAX_SIZE = 6;

export interface TeamSlot {
  readonly index: number;
  readonly pokemonId: number;
}

export interface TeamComposition {
  readonly slots: ReadonlyArray<TeamSlot>;
}

export interface TeamStatTotals {
  readonly hp: number;
  readonly attack: number;
  readonly defense: number;
  readonly specialAttack: number;
  readonly specialDefense: number;
  readonly speed: number;
  readonly total: number;
}

export interface TeamTypeCount {
  readonly type: PokemonTypeName;
  readonly count: number;
}
