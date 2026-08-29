import { Observable } from 'rxjs';

import { TeamSlot } from '../../core/models/team.model';

export abstract class TeamRepository {
  abstract loadTeam(): Observable<ReadonlyArray<TeamSlot>>;
  abstract addPokemon(pokemonId: number): Observable<ReadonlyArray<TeamSlot>>;
  abstract removePokemon(slotIndex: number): Observable<ReadonlyArray<TeamSlot>>;
  abstract swapPokemon(
    slotIndex: number,
    pokemonId: number,
  ): Observable<ReadonlyArray<TeamSlot>>;
  abstract clearTeam(): Observable<ReadonlyArray<TeamSlot>>;
  abstract watchTeam(): Observable<ReadonlyArray<TeamSlot>>;
  abstract snapshot(): ReadonlyArray<TeamSlot>;
  abstract isFull(): boolean;
}
