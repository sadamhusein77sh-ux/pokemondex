import { Injectable, inject } from '@angular/core';
import { Observable, distinctUntilChanged, map, shareReplay } from 'rxjs';

import { TeamSlot } from '../../core/models/team.model';
import { TeamRepository } from '../../domain/repositories/team.repository';

@Injectable({ providedIn: 'root' })
export class GetTeamUseCase {
  private readonly repository = inject(TeamRepository);

  execute(): Observable<ReadonlyArray<TeamSlot>> {
    return this.repository
      .loadTeam()
      .pipe(
        distinctUntilChanged(),
        map((slots) => [...slots]),
        shareReplay({ bufferSize: 1, refCount: true }),
      );
  }
}

@Injectable({ providedIn: 'root' })
export class AddToTeamUseCase {
  private readonly repository = inject(TeamRepository);

  execute(pokemonId: number): Observable<ReadonlyArray<TeamSlot>> {
    return this.repository.addPokemon(pokemonId);
  }
}

@Injectable({ providedIn: 'root' })
export class RemoveFromTeamUseCase {
  private readonly repository = inject(TeamRepository);

  execute(slotIndex: number): Observable<ReadonlyArray<TeamSlot>> {
    return this.repository.removePokemon(slotIndex);
  }
}

@Injectable({ providedIn: 'root' })
export class SwapTeamSlotUseCase {
  private readonly repository = inject(TeamRepository);

  execute(
    slotIndex: number,
    pokemonId: number,
  ): Observable<ReadonlyArray<TeamSlot>> {
    return this.repository.swapPokemon(slotIndex, pokemonId);
  }
}

@Injectable({ providedIn: 'root' })
export class ClearTeamUseCase {
  private readonly repository = inject(TeamRepository);

  execute(): Observable<ReadonlyArray<TeamSlot>> {
    return this.repository.clearTeam();
  }
}
