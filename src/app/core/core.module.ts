import { NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';

import { POKE_API_BASE_URL, PokeApiService } from '../infrastructure/api/poke-api.service';
import { LOCAL_STORAGE_BACKING } from '../infrastructure/storage/ionic-storage.service';
import { FavoritesRepository } from '../domain/repositories/favorites.repository';
import { FavoritesRepositoryImpl } from '../application/favorites/favorites.repository.impl';
import { BrowsePreferencesRepository } from '../domain/repositories/browse-preferences.repository';
import { BrowsePreferencesRepositoryImpl } from '../application/preferences/browse-preferences.repository.impl';
import { TeamRepository } from '../domain/repositories/team.repository';
import { TeamRepositoryImpl } from '../application/team/team.repository.impl';
import {
  GetFavoritesUseCase,
  IsFavoriteUseCase,
  ToggleFavoriteUseCase,
} from '../application/favorites/favorites.usecases';
import {
  GetTypeFilterUseCase,
  GetSortModeUseCase,
  SetSortModeUseCase,
  SetTypeFilterUseCase,
} from '../application/preferences/browse-preferences.usecases';
import {
  AddToTeamUseCase,
  ClearTeamUseCase,
  GetTeamUseCase,
  RemoveFromTeamUseCase,
  SwapTeamSlotUseCase,
} from '../application/team/team.usecases';
import {
  ComputeTeamStatsUseCase,
  ComputeTeamTypeCoverageUseCase,
} from '../application/team/team-coverage.usecases';
import {
  GetPokemonByTypeUseCase,
  GetPokemonDetailUseCase,
  GetPokemonListUseCase,
  GetPokemonTypesUseCase,
} from '../application/pokemon/pokemon.usecases';

const POKE_API_BASE = 'https://pokeapi.co/api/v2';

@NgModule({
  imports: [CommonModule],
  providers: [
    { provide: POKE_API_BASE_URL, useValue: POKE_API_BASE },
    { provide: LOCAL_STORAGE_BACKING, useFactory: resolveBrowserBacking },
    { provide: FavoritesRepository, useExisting: FavoritesRepositoryImpl },
    { provide: BrowsePreferencesRepository, useExisting: BrowsePreferencesRepositoryImpl },
    { provide: TeamRepository, useExisting: TeamRepositoryImpl },
    PokeApiService,
    FavoritesRepositoryImpl,
    BrowsePreferencesRepositoryImpl,
    TeamRepositoryImpl,
    GetPokemonListUseCase,
    GetPokemonDetailUseCase,
    GetPokemonByTypeUseCase,
    GetPokemonTypesUseCase,
    GetFavoritesUseCase,
    IsFavoriteUseCase,
    ToggleFavoriteUseCase,
    GetTypeFilterUseCase,
    SetTypeFilterUseCase,
    GetSortModeUseCase,
    SetSortModeUseCase,
    GetTeamUseCase,
    AddToTeamUseCase,
    RemoveFromTeamUseCase,
    SwapTeamSlotUseCase,
    ClearTeamUseCase,
    ComputeTeamTypeCoverageUseCase,
    ComputeTeamStatsUseCase,
  ],
})
export class CoreModule {
  constructor(@Optional() @SkipSelf() parent?: CoreModule) {
    if (parent) {
      throw new Error('CoreModule is already loaded. Import it in the AppModule only.');
    }
  }
}

function resolveBrowserBacking() {
  if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
    const ls = (globalThis as { localStorage?: Storage }).localStorage;
    if (ls !== undefined && typeof ls.getItem === 'function') {
      return {
        get: async (k: string) => ls.getItem(k),
        set: async (k: string, v: string) => {
          ls.setItem(k, v);
        },
        remove: async (k: string) => {
          ls.removeItem(k);
        },
      };
    }
  }
  return {
    get: async () => null,
    set: async () => undefined,
    remove: async () => undefined,
  };
}
