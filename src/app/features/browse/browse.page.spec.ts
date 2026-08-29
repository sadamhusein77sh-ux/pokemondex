import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ModalController, ToastController } from '@ionic/angular/lazy';
import { BehaviorSubject, of, Subject } from 'rxjs';

import { BrowsePage } from './browse.page';
import {
  GetPokemonByTypeUseCase,
  GetPokemonListUseCase,
} from '../../application/pokemon/pokemon.usecases';
import {
  GetFavoritesUseCase,
  ToggleFavoriteUseCase,
} from '../../application/favorites/favorites.usecases';
import {
  GetSortModeUseCase,
  GetTypeFilterUseCase,
  SetSortModeUseCase,
  SetTypeFilterUseCase,
} from '../../application/preferences/browse-preferences.usecases';
import { SortMode } from '../../domain/repositories/browse-preferences.repository';
import { PokemonTypeName } from '../../core/models/pokemon-type.model';
import { SharedModule } from '../../shared/shared.module';
import { CommonModule } from '@angular/common';

class MockListUseCase {
  response: unknown = of({
    count: 1302,
    nextOffset: 20,
    results: Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      name: `poke-${i + 1}`,
      imageUrl: `https://example.test/${i + 1}.png`,
      types: [{ name: 'normal', url: 'x' }],
    })),
  });

  execute() {
    return this.response as any;
  }
}

class MockByTypeUseCase {
  response: unknown = of({
    count: 0,
    nextOffset: null,
    results: [],
  });

  execute() {
    return this.response as any;
  }
}

class MockFavoritesUseCases {
  stream$ = new Subject<ReadonlyArray<number>>();
  toggleReturn: any = of([1]);

  execute(...args: unknown[]): any {
    if (args.length === 0) {
      return this.stream$.asObservable();
    }
    return this.toggleReturn;
  }

  snapshot(): boolean {
    return false;
  }
}

class MockTypeFilterUseCases {
  private readonly subject = new BehaviorSubject<PokemonTypeName | null>(null);
  readonly saves: Array<PokemonTypeName | null> = [];

  execute() {
    return this.subject.asObservable();
  }

  executeSet(type: PokemonTypeName | null) {
    this.saves.push(type);
    this.subject.next(type);
    return of(type);
  }

  emit(value: PokemonTypeName | null) {
    this.subject.next(value);
  }
}

class MockSortModeUseCases {
  private readonly subject = new BehaviorSubject<SortMode>('id');
  readonly saves: SortMode[] = [];

  execute() {
    return this.subject.asObservable();
  }

  executeSet(mode: SortMode) {
    this.saves.push(mode);
    this.subject.next(mode);
    return of(mode);
  }

  emit(mode: SortMode) {
    this.subject.next(mode);
  }
}

class MockActivatedRoute {
  private readonly subject = new BehaviorSubject<ReadonlyMap<string, string>>(new Map());
  snapshot = { queryParamMap: convertParamMap(this.subject.value) };
  queryParamMap = this.subject.asObservable();

  setQueryParam(key: string, value: string | null): void {
    const next = new Map(this.subject.value);
    if (value === null) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    this.subject.next(next);
    this.snapshot = { queryParamMap: convertParamMap(next) };
  }
}

function convertParamMap(
  map: ReadonlyMap<string, string>,
): { get(key: string): string | null; has(key: string): boolean } {
  return {
    get: (key: string) => (map.has(key) ? (map.get(key) as string) : null),
    has: (key: string) => map.has(key),
  };
}

class MockRouter {
  navigateCalls: Array<{ commands: unknown[]; extras: unknown }> = [];
  navigate(commands: unknown[], extras: unknown): Promise<boolean> {
    this.navigateCalls.push({ commands, extras });
    return Promise.resolve(true);
  }
}

class MockModalController {
  createCalls: unknown[] = [];
  async create(opts: unknown) {
    this.createCalls.push(opts);
    return { present: () => Promise.resolve() };
  }
}

class MockToastController {
  async create() {
    return { present: () => Promise.resolve() };
  }
}

describe('BrowsePage', () => {
  let fixture: ComponentFixture<BrowsePage>;
  let component: BrowsePage;
  let listUseCase: MockListUseCase;
  let byTypeUseCase: MockByTypeUseCase;
  let favorites: MockFavoritesUseCases;
  let typeFilter: MockTypeFilterUseCases;
  let sortMode: MockSortModeUseCases;
  let modal: MockModalController;
  let route: MockActivatedRoute;
  let router: MockRouter;

  beforeEach(() => {
    listUseCase = new MockListUseCase();
    byTypeUseCase = new MockByTypeUseCase();
    favorites = new MockFavoritesUseCases();
    typeFilter = new MockTypeFilterUseCases();
    sortMode = new MockSortModeUseCases();
    modal = new MockModalController();
    route = new MockActivatedRoute();
    router = new MockRouter();

    TestBed.configureTestingModule({
      imports: [CommonModule, SharedModule],
      declarations: [BrowsePage],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        { provide: GetPokemonListUseCase, useValue: listUseCase },
        { provide: GetPokemonByTypeUseCase, useValue: byTypeUseCase },
        { provide: GetFavoritesUseCase, useValue: favorites },
        { provide: ToggleFavoriteUseCase, useValue: favorites },
        { provide: GetTypeFilterUseCase, useValue: typeFilter },
        {
          provide: SetTypeFilterUseCase,
          useValue: { execute: (type: PokemonTypeName | null) => typeFilter.executeSet(type) },
        },
        { provide: GetSortModeUseCase, useValue: sortMode },
        {
          provide: SetSortModeUseCase,
          useValue: { execute: (mode: SortMode) => sortMode.executeSet(mode) },
        },
        { provide: ActivatedRoute, useValue: route },
        { provide: Router, useValue: router },
        { provide: ModalController, useValue: modal },
        { provide: ToastController, useValue: new MockToastController() },
      ],
    });

    fixture = TestBed.createComponent(BrowsePage);
    component = fixture.componentInstance;
  });

  it('renders the first 20 Pokemon on load', async () => {
    fixture.detectChanges();
    await Promise.resolve();
    await Promise.resolve();
    expect(component.state()).toBe('success');
    expect(component.items().length).toBe(20);
  });

  it('emits the error state when the API fails', async () => {
    listUseCase.response = new Subject<any>();
    fixture = TestBed.createComponent(BrowsePage);
    component = fixture.componentInstance;
    const subject = listUseCase.response as Subject<any>;
    fixture.detectChanges();
    await Promise.resolve();
    subject.error(new Error('boom'));
    await Promise.resolve();
    await Promise.resolve();
    expect(component.state()).toBe('error');
  });

  it('renders the empty state when results are empty', async () => {
    listUseCase.response = of({ count: 0, nextOffset: null, results: [] });
    fixture = TestBed.createComponent(BrowsePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await Promise.resolve();
    expect(component.state()).toBe('empty');
  });

  it('opens the detail modal when a card is tapped', async () => {
    fixture.detectChanges();
    await Promise.resolve();
    const sample = component.items()[0];
    await component.openDetail(sample);
    expect(modal.createCalls.length).toBe(1);
  });

  it('toggles favorite and shows a toast', async () => {
    fixture.detectChanges();
    await Promise.resolve();
    const item = component.items()[0];
    component.onToggleFavorite(item);
    expect(component.isFavorite(item)).toBe(true);
  });

  it('updates the active type on filter selection', async () => {
    fixture.detectChanges();
    await Promise.resolve();
    component.onSelectType('fire');
    expect(component.activeType()).toBe('fire');
  });

  it('ignores re-selecting the same type', async () => {
    fixture.detectChanges();
    await Promise.resolve();
    component.onSelectType('fire');
    const before = component.offset();
    component.onSelectType('fire');
    expect(component.offset()).toBe(before);
  });

  it('blocks load-more while a fetch is in flight', async () => {
    fixture.detectChanges();
    await Promise.resolve();
    const subject = new Subject<any>();
    listUseCase.response = subject;
    const promise = component['loadNextPage']();
    const second = component['loadNextPage']();
    expect(component.isFetchingMore()).toBe(true);
    subject.complete();
    await promise;
    await second;
    expect(component.isFetchingMore()).toBe(false);
  });

  it('appends successive pages without breaking (regression for "only loads once" bug)', async () => {
    fixture.detectChanges();
    await Promise.resolve();
    await Promise.resolve();
    expect(component.items().length).toBe(20);

    listUseCase.response = of({
      count: 1302,
      nextOffset: 40,
      results: Array.from({ length: 20 }, (_, i) => ({
        id: i + 21,
        name: `poke-${i + 21}`,
        imageUrl: `https://example.test/${i + 21}.png`,
        types: [{ name: 'normal', url: 'x' }],
      })),
    });
    await component['loadNextPage']();
    expect(component.items().length).toBe(40);

    listUseCase.response = of({
      count: 1302,
      nextOffset: 60,
      results: Array.from({ length: 20 }, (_, i) => ({
        id: i + 41,
        name: `poke-${i + 41}`,
        imageUrl: `https://example.test/${i + 41}.png`,
        types: [{ name: 'normal', url: 'x' }],
      })),
    });
    await component['loadNextPage']();
    expect(component.items().length).toBe(60);

    listUseCase.response = of({
      count: 1302,
      nextOffset: null,
      results: Array.from({ length: 20 }, (_, i) => ({
        id: i + 61,
        name: `poke-${i + 61}`,
        imageUrl: `https://example.test/${i + 61}.png`,
        types: [{ name: 'normal', url: 'x' }],
      })),
    });
    await component['loadNextPage']();
    expect(component.items().length).toBe(80);
    expect(component.hasMore()).toBe(false);
  });

  it('loadNextPage is safe when called repeatedly', async () => {
    fixture.detectChanges();
    await Promise.resolve();
    await Promise.resolve();
    const before = component.items().length;
    const subject = new Subject<any>();
    listUseCase.response = subject;
    const first = component['loadNextPage']();
    const second = component['loadNextPage']();
    expect(component.isFetchingMore()).toBe(true);
    subject.complete();
    await first;
    await second;
    expect(component.isFetchingMore()).toBe(false);
    expect(component.items().length).toBeGreaterThanOrEqual(before);
  });

  describe('type filter persistence', () => {
    it('hydrates activeType from the persisted filter on init', async () => {
      typeFilter.emit('fire');
      fixture = TestBed.createComponent(BrowsePage);
      component = fixture.componentInstance;
      fixture.detectChanges();
      await Promise.resolve();
      await Promise.resolve();
      expect(component.activeType()).toBe('fire');
    });

    it('calls the by-type use case when a filter is hydrated', async () => {
      byTypeUseCase.response = of({
        count: 5,
        nextOffset: null,
        results: Array.from({ length: 5 }, (_, i) => ({
          id: i + 4,
          name: `charmander-${i}`,
          imageUrl: `https://example.test/${i + 4}.png`,
          types: [{ name: 'fire', url: 'x' }],
        })),
      });
      typeFilter.emit('fire');
      fixture = TestBed.createComponent(BrowsePage);
      component = fixture.componentInstance;
      fixture.detectChanges();
      await Promise.resolve();
      await Promise.resolve();
      expect(component.activeType()).toBe('fire');
      expect(component.items().length).toBe(5);
      expect(component.hasMore()).toBe(false);
    });

    it('persists the chosen type via SetTypeFilterUseCase', () => {
      fixture.detectChanges();
      component.onSelectType('water');
      expect(typeFilter.saves).toEqual(['water']);
      component.onSelectType(null);
      expect(typeFilter.saves).toEqual(['water', null]);
    });
  });

  describe('URL query-param sync', () => {
    it('hydrates activeType from ?type= on init', async () => {
      route.setQueryParam('type', 'fire');
      fixture = TestBed.createComponent(BrowsePage);
      component = fixture.componentInstance;
      fixture.detectChanges();
      await Promise.resolve();
      await Promise.resolve();
      expect(component.activeType()).toBe('fire');
      expect(typeFilter.saves).toContain('fire');
    });

    it('ignores unknown ?type= values and falls back to storage', async () => {
      route.setQueryParam('type', 'not-a-type');
      typeFilter.emit('water');
      fixture = TestBed.createComponent(BrowsePage);
      component = fixture.componentInstance;
      fixture.detectChanges();
      await Promise.resolve();
      await Promise.resolve();
      expect(component.activeType()).toBe('water');
    });

    it('writes the chosen type into the URL on onSelectType', async () => {
      fixture.detectChanges();
      await Promise.resolve();
      component.onSelectType('grass');
      await Promise.resolve();
      const last = router.navigateCalls.at(-1);
      expect(last?.commands).toEqual([]);
      const extras = last?.extras as
        | {
            queryParams?: Record<string, string | null>;
            queryParamsHandling?: string;
          }
        | undefined;
      expect(extras?.queryParams?.['type']).toBe('grass');
      expect(extras?.queryParamsHandling).toBe('merge');
    });

    it('writes null into the URL when the filter is cleared', async () => {
      fixture.detectChanges();
      await Promise.resolve();
      component.onSelectType('fire');
      await Promise.resolve();
      component.onSelectType(null);
      await Promise.resolve();
      const last = router.navigateCalls.at(-1);
      const extras = last?.extras as
        | { queryParams?: Record<string, string | null> }
        | undefined;
      expect(extras?.queryParams?.['type']).toBeNull();
    });

    it('reacts to back/forward navigation by re-applying the filter', async () => {
      fixture.detectChanges();
      await Promise.resolve();
      route.setQueryParam('type', 'electric');
      await Promise.resolve();
      expect(component.activeType()).toBe('electric');
      expect(typeFilter.saves).toContain('electric');
    });
  });

  describe('sort mode', () => {
    it('hydrates the sort mode from storage on init', async () => {
      sortMode.emit('name');
      fixture = TestBed.createComponent(BrowsePage);
      component = fixture.componentInstance;
      fixture.detectChanges();
      await Promise.resolve();
      expect(component.sortMode()).toBe('name');
    });

    it('toggles between id and name and persists the new mode', async () => {
      fixture.detectChanges();
      await Promise.resolve();
      component.toggleSortMode();
      expect(component.sortMode()).toBe('name');
      expect(sortMode.saves).toEqual(['name']);
      component.toggleSortMode();
      expect(component.sortMode()).toBe('id');
      expect(sortMode.saves).toEqual(['name', 'id']);
    });

    it('exposes a sortedItems computed that reorders by id by default', async () => {
      fixture.detectChanges();
      await Promise.resolve();
      const list = component.items();
      const sorted = component.sortedItems();
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i - 1]!.id).toBeLessThanOrEqual(sorted[i]!.id);
      }
      expect(sorted.length).toBe(list.length);
    });

    it('sorts by name when sort mode is name', async () => {
      sortMode.emit('name');
      fixture = TestBed.createComponent(BrowsePage);
      component = fixture.componentInstance;
      fixture.detectChanges();
      await Promise.resolve();
      await Promise.resolve();
      const sorted = component.sortedItems();
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i - 1]!.name.localeCompare(sorted[i]!.name)).toBeLessThanOrEqual(0);
      }
    });
  });
});
