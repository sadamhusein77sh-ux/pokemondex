import { firstValueFrom } from 'rxjs';

import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { HttpClient, provideHttpClient } from '@angular/common/http';

import {
  POKE_API_BASE_URL,
  PokeApiService,
} from './poke-api.service';

describe('PokeApiService', () => {
  const baseUrl = 'https://pokeapi.test/api/v2';

  let service: PokeApiService;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: POKE_API_BASE_URL, useValue: baseUrl },
        PokeApiService,
      ],
    });

    service = TestBed.inject(PokeApiService);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    controller.verify();
  });

  it('issues a paginated list request', async () => {
    const pending = firstValueFrom(service.listPokemon({ limit: 20, offset: 0 }));

    const req = controller.expectOne(
      (r) =>
        r.url === `${baseUrl}/pokemon` &&
        r.params.get('limit') === '20' &&
        r.params.get('offset') === '0',
    );
    expect(req.request.method).toBe('GET');
    req.flush({
      count: 1302,
      next: `${baseUrl}/pokemon?offset=20&limit=20`,
      previous: null,
      results: [
        { name: 'bulbasaur', url: `${baseUrl}/pokemon/1/` },
        { name: 'ivysaur', url: `${baseUrl}/pokemon/2/` },
      ],
    });

    const page = await pending;
    expect(page.count).toBe(1302);
    expect(page.nextOffset).toBe(20);
    expect(page.results.length).toBe(2);
    expect(page.results[0].id).toBe(1);
    expect(page.results[0].imageUrl).toContain('1.png');
    expect(page.results[0].types).toEqual([]);
  });

  it('returns nextOffset=null when there are no more results', async () => {
    const pending = firstValueFrom(service.listPokemon({ limit: 20, offset: 100 }));

    const req = controller.expectOne((r) => r.url === `${baseUrl}/pokemon`);
    req.flush({
      count: 120,
      next: null,
      previous: null,
      results: [],
    });

    const page = await pending;
    expect(page.nextOffset).toBeNull();
  });

  it('maps a detail response and builds fallback sprites', async () => {
    const pending = firstValueFrom(service.getPokemonDetail(25));

    const req = controller.expectOne(`${baseUrl}/pokemon/25`);
    expect(req.request.method).toBe('GET');
    req.flush({
      id: 25,
      name: 'pikachu',
      height: 4,
      weight: 60,
      sprites: {
        other: { 'official-artwork': { front_default: null } },
        front_default: 'https://cdn/pikachu.png',
      },
      types: [{ slot: 1, type: { name: 'electric', url: 'x' } }],
      abilities: [{ ability: { name: 'static', url: 'x' }, is_hidden: false }],
      stats: [{ base_stat: 90, stat: { name: 'speed', url: 'x' } }],
      moves: [{ move: { name: 'thunder-shock', url: 'x' } }],
    });

    const detail = await pending;
    expect(detail.id).toBe(25);
    expect(detail.name).toBe('pikachu');
    expect(detail.types.map((t) => t.name)).toEqual(['electric']);
    expect(detail.abilities).toEqual([{ name: 'static', isHidden: false }]);
    expect(detail.stats).toEqual([{ name: 'speed', baseValue: 90 }]);
    expect(detail.moves.map((m) => m.name)).toEqual(['thunder-shock']);
    expect(detail.imageUrl).toContain('25.png');
  });

  it('builds an artwork url when the API does not provide one', async () => {
    const pending = firstValueFrom(service.getPokemonDetail('pikachu'));

    const req = controller.expectOne(`${baseUrl}/pokemon/pikachu`);
    req.flush({
      id: 25,
      name: 'pikachu',
      height: 4,
      weight: 60,
      sprites: {},
      types: [],
      abilities: [],
      stats: [],
      moves: [],
    });

    const detail = await pending;
    expect(detail.imageUrl).toContain('official-artwork/25.png');
  });

  it('maps a type listing to a list page', async () => {
    const pending = firstValueFrom(service.listByType('fire'));

    const req = controller.expectOne(`${baseUrl}/type/fire`);
    expect(req.request.method).toBe('GET');
    req.flush({
      pokemon: [
        { pokemon: { name: 'charmander', url: `${baseUrl}/pokemon/4/` }, slot: 1 },
        { pokemon: { name: 'charmeleon', url: `${baseUrl}/pokemon/5/` }, slot: 1 },
      ],
    });

    const page = await pending;
    expect(page.count).toBe(2);
    expect(page.nextOffset).toBeNull();
    expect(page.results.every((p) => p.types[0].name === 'fire')).toBe(true);
  });

  it('returns the list of canonical pokemon types', async () => {
    const pending = firstValueFrom(service.listTypes());

    const req = controller.expectOne(`${baseUrl}/type`);
    req.flush({
      results: [
        { name: 'normal', url: 'x' },
        { name: 'fire', url: 'x' },
        { name: 'unknown', url: 'x' },
      ],
    });

    const types = await pending;
    expect(types.length).toBeGreaterThanOrEqual(2);
    expect(types.map((t) => t.name)).toContain('fire');
    expect(types.map((t) => t.name)).not.toContain('unknown');
  });
});
