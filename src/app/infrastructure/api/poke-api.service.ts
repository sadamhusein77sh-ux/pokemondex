import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, InjectionToken, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { PokemonDetail } from '../../core/models/pokemon-detail.model';
import { PokemonListPage, PokemonListItem, PokemonListQuery } from '../../core/models/pokemon-list.model';
import {
  isPokemonTypeName,
  PokemonTypeName,
  PokemonTypeRef,
} from '../../core/models/pokemon-type.model';
import { extractIdFromUrl } from '../../core/utils/id-extractor';
import {
  buildOfficialArtworkUrl,
  buildPlaceholderUrl,
  buildSpriteFallbackUrls,
} from '../../core/utils/image-url.builder';

export const POKE_API_BASE_URL = new InjectionToken<string>('POKE_API_BASE_URL');

interface ListResponseDto {
  count: number;
  next: string | null;
  previous: string | null;
  results: Array<{ name: string; url: string }>;
}

interface TypeResponseDto {
  pokemon: Array<{ pokemon: { name: string; url: string }; slot: number }>;
}

interface PokemonDetailDto {
  id: number;
  name: string;
  height: number;
  weight: number;
  sprites: {
    other?: { 'official-artwork'?: { front_default?: string | null } };
    front_default?: string | null;
    front_shiny?: string | null;
  };
  types: Array<{ slot: number; type: { name: string; url: string } }>;
  abilities: Array<{ ability: { name: string; url: string }; is_hidden: boolean }>;
  stats: Array<{ base_stat: number; stat: { name: string; url: string } }>;
  moves: Array<{ move: { name: string; url: string } }>;
}

@Injectable({ providedIn: 'root' })
export class PokeApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(POKE_API_BASE_URL);

  listPokemon(query: PokemonListQuery): Observable<PokemonListPage> {
    const params = new HttpParams()
      .set('limit', query.limit.toString())
      .set('offset', query.offset.toString());

    return this.http
      .get<ListResponseDto>(`${this.baseUrl}/pokemon`, { params })
      .pipe(map((dto) => this.mapList(dto, query.offset, query.limit)));
  }

  getPokemonDetail(idOrName: number | string): Observable<PokemonDetail> {
    return this.http
      .get<PokemonDetailDto>(`${this.baseUrl}/pokemon/${idOrName}`)
      .pipe(map((dto) => this.mapDetail(dto)));
  }

  listByType(typeName: PokemonTypeName): Observable<PokemonListPage> {
    return this.http.get<TypeResponseDto>(`${this.baseUrl}/type/${typeName}`).pipe(
      map((dto) => {
        const items: PokemonListItem[] = dto.pokemon.map((entry) => {
          const id = extractIdFromUrl(entry.pokemon.url) ?? 0;
          return {
            id,
            name: entry.pokemon.name,
            imageUrl: buildOfficialArtworkUrl(id),
            types: [{ name: typeName, url: entry.pokemon.url }],
          };
        });
        return {
          count: items.length,
          nextOffset: null,
          results: items,
        };
      }),
    );
  }

  listTypes(): Observable<ReadonlyArray<PokemonTypeRef>> {
    return this.http
      .get<{ results: Array<{ name: string; url: string }> }>(`${this.baseUrl}/type`)
      .pipe(
        map((dto) =>
          dto.results
            .filter((type) => isPokemonTypeName(type.name))
            .map((type) => ({ name: type.name as PokemonTypeName, url: type.url })),
        ),
      );
  }

  private mapList(
    dto: ListResponseDto,
    offset: number,
    limit: number,
  ): PokemonListPage {
    const results: PokemonListItem[] = dto.results.map((entry) => {
      const id = extractIdFromUrl(entry.url) ?? 0;
      return {
        id,
        name: entry.name,
        imageUrl: buildOfficialArtworkUrl(id),
        types: [],
      };
    });

    const nextOffset =
      dto.next === null ? null : Math.min(offset + limit, dto.count);

    return {
      count: dto.count,
      nextOffset,
      results,
    };
  }

  private mapDetail(dto: PokemonDetailDto): PokemonDetail {
    const artwork =
      dto.sprites.other?.['official-artwork']?.front_default ?? null;
    const types: PokemonTypeRef[] = dto.types
      .slice()
      .sort((a, b) => a.slot - b.slot)
      .map((entry) => ({ name: entry.type.name as PokemonTypeName, url: entry.type.url }));

    const fallbackChain: string[] = [];
    if (dto.sprites.front_default !== undefined && dto.sprites.front_default !== null) {
      fallbackChain.push(dto.sprites.front_default);
    }
    fallbackChain.push(...buildSpriteFallbackUrls(dto.id));

    return {
      id: dto.id,
      name: dto.name,
      imageUrl: artwork ?? buildOfficialArtworkUrl(dto.id),
      types,
      height: dto.height,
      weight: dto.weight,
      abilities: dto.abilities.map((entry) => ({
        name: entry.ability.name,
        isHidden: entry.is_hidden,
      })),
      stats: dto.stats.map((entry) => ({
        name: entry.stat.name,
        baseValue: entry.base_stat,
      })),
      moves: dto.moves.map((entry) => ({ name: entry.move.name })),
      spriteFallbacks: fallbackChain.length > 0 ? fallbackChain : [buildPlaceholderUrl(dto.name)],
    };
  }
}
