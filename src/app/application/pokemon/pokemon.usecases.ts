import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { PokemonDetail } from '../../core/models/pokemon-detail.model';
import { PokemonListPage, PokemonListQuery } from '../../core/models/pokemon-list.model';
import { PokemonTypeName } from '../../core/models/pokemon-type.model';
import { PokemonCacheService } from '../../infrastructure/cache/pokemon-cache.service';
import { PokeApiService } from '../../infrastructure/api/poke-api.service';

@Injectable({ providedIn: 'root' })
export class GetPokemonListUseCase {
  private readonly api = inject(PokeApiService);

  execute(query: PokemonListQuery): Observable<PokemonListPage> {
    return this.api.listPokemon(query);
  }
}

@Injectable({ providedIn: 'root' })
export class GetPokemonDetailUseCase {
  private readonly api = inject(PokeApiService);
  private readonly cache = inject(PokemonCacheService);

  execute(idOrName: number | string): Observable<PokemonDetail> {
    if (typeof idOrName === 'number') {
      const cached = this.cache.get(idOrName);
      if (cached !== null) {
        return new Observable<PokemonDetail>((observer) => {
          observer.next(cached);
          observer.complete();
        });
      }
    }
    return new Observable<PokemonDetail>((observer) => {
      const subscription = this.api.getPokemonDetail(idOrName).subscribe({
        next: (detail) => {
          this.cache.set(detail.id, detail);
          observer.next(detail);
        },
        error: (err) => observer.error(err),
        complete: () => observer.complete(),
      });
      return () => subscription.unsubscribe();
    });
  }
}

@Injectable({ providedIn: 'root' })
export class GetPokemonByTypeUseCase {
  private readonly api = inject(PokeApiService);

  execute(typeName: PokemonTypeName): Observable<PokemonListPage> {
    return this.api.listByType(typeName);
  }
}

@Injectable({ providedIn: 'root' })
export class GetPokemonTypesUseCase {
  private readonly api = inject(PokeApiService);

  execute() {
    return this.api.listTypes();
  }
}
