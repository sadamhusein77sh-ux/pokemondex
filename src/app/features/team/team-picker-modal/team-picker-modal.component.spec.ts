import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ModalController } from '@ionic/angular/lazy';
import { of, Subject } from 'rxjs';

import { TeamPickerModalComponent } from './team-picker-modal.component';
import { SharedModule } from '../../../shared/shared.module';
import { CommonModule } from '@angular/common';
import {
  GetPokemonByTypeUseCase,
  GetPokemonListUseCase,
} from '../../../application/pokemon/pokemon.usecases';
import { PokemonListPage } from '../../../core/models/pokemon-list.model';

class MockListUseCase {
  response: PokemonListPage = {
    count: 40,
    nextOffset: 20,
    results: Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      name: `poke-${i + 1}`,
      imageUrl: `https://example.test/${i + 1}.png`,
      types: [],
    })),
  };

  execute() {
    return of(this.response);
  }

  setResponse(next: PokemonListPage): void {
    this.response = next;
  }
}

class MockByTypeUseCase {
  response: PokemonListPage = {
    count: 0,
    nextOffset: null,
    results: [],
  };

  execute() {
    return of(this.response);
  }

  setResponse(next: PokemonListPage): void {
    this.response = next;
  }
}

class MockModalController {
  createCalls: unknown[] = [];
  dismissValue: unknown = undefined;
  async create(opts: unknown) {
    this.createCalls.push(opts);
    return {
      present: async () => undefined,
      onDidDismiss: async () => ({ data: this.dismissValue, role: undefined }),
    };
  }
  async dismiss(value?: unknown) {
    this.dismissValue = value;
    return value;
  }
}

describe('TeamPickerModalComponent', () => {
  let fixture: ComponentFixture<TeamPickerModalComponent>;
  let component: TeamPickerModalComponent;
  let listUseCase: MockListUseCase;
  let byTypeUseCase: MockByTypeUseCase;
  let modal: MockModalController;

  beforeEach(() => {
    listUseCase = new MockListUseCase();
    byTypeUseCase = new MockByTypeUseCase();
    modal = new MockModalController();
    TestBed.configureTestingModule({
      imports: [CommonModule, SharedModule],
      declarations: [TeamPickerModalComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        { provide: GetPokemonListUseCase, useValue: listUseCase },
        { provide: GetPokemonByTypeUseCase, useValue: byTypeUseCase },
        { provide: ModalController, useValue: modal },
      ],
    });
    fixture = TestBed.createComponent(TeamPickerModalComponent);
    component = fixture.componentInstance;
  });

  it('loads the first page of Pokemon via the list endpoint on view enter', async () => {
    fixture.detectChanges();
    component.ionViewWillEnter();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
    expect(component.state()).toBe('success');
    expect(component.items().length).toBe(20);
    expect(component.hasMore()).toBe(true);
    expect(component.offset()).toBe(20);
  });

  it('filters the loaded pool by name', async () => {
    fixture.detectChanges();
    component.ionViewWillEnter();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
    component.onSearch('poke-7');
    await new Promise((r) => setTimeout(r, 260));
    expect(component.displayCount()).toBe(1);
    expect(component.filteredItems()[0].name).toBe('poke-7');
  });

  it('debounces search input by ~250ms', async () => {
    fixture.detectChanges();
    component.ionViewWillEnter();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
    component.onSearch('pika');
    expect(component.displayCount()).toBe(20);
    await new Promise((r) => setTimeout(r, 260));
    expect(component.searchTerm()).toBe('pika');
  });

  it('excludes ids that are already in the team', async () => {
    component.excludedIds = [1];
    fixture.detectChanges();
    component.ionViewWillEnter();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
    expect(component.filteredItems().length).toBe(19);
    expect(
      component.filteredItems().every((item) => item.id !== 1),
    ).toBe(true);
  });

  it('switches to by-type endpoint when a type is selected', async () => {
    byTypeUseCase.setResponse({
      count: 3,
      nextOffset: null,
      results: [
        { id: 4, name: 'charmander', imageUrl: 'x', types: [{ name: 'fire', url: 'u' }] },
        { id: 5, name: 'charmeleon', imageUrl: 'y', types: [{ name: 'fire', url: 'u' }] },
        { id: 6, name: 'charizard', imageUrl: 'z', types: [{ name: 'fire', url: 'u' }, { name: 'flying', url: 'u' }] },
      ],
    });
    fixture.detectChanges();
    component.ionViewWillEnter();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
    component.onSelectType('fire');
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
    expect(component.activeType()).toBe('fire');
    expect(component.items().length).toBe(3);
    expect(component.hasMore()).toBe(false);
  });

  it('does not refetch when the active type is re-selected', async () => {
    byTypeUseCase.setResponse({
      count: 1,
      nextOffset: null,
      results: [{ id: 4, name: 'charmander', imageUrl: 'x', types: [{ name: 'fire', url: 'u' }] }],
    });
    fixture.detectChanges();
    component.ionViewWillEnter();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
    component.onSelectType('fire');
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
    component.onSelectType('fire');
    const firstCount = component.items().length;
    expect(firstCount).toBe(1);
  });

  it('appends a second page when loadNextPage is called directly', async () => {
    fixture.detectChanges();
    component.ionViewWillEnter();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
    listUseCase.setResponse({
      count: 40,
      nextOffset: null,
      results: Array.from({ length: 20 }, (_, i) => ({
        id: i + 21,
        name: `poke-${i + 21}`,
        imageUrl: `https://example.test/${i + 21}.png`,
        types: [],
      })),
    });
    await (component as unknown as { loadNextPage: () => Promise<void> }).loadNextPage();
    expect(component.items().length).toBe(40);
    expect(component.hasMore()).toBe(false);
  });

  it('blocks loadNextPage while a fetch is in flight', async () => {
    const subject = new Subject<PokemonListPage>();
    listUseCase.setResponse({
      count: 40,
      nextOffset: 20,
      results: Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        name: `poke-${i + 1}`,
        imageUrl: `x`,
        types: [],
      })),
    });
    fixture.detectChanges();
    component.ionViewWillEnter();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    listUseCase.execute = () => subject as unknown as ReturnType<MockListUseCase['execute']>;
    const first = (component as unknown as { loadNextPage: () => Promise<void> }).loadNextPage();
    const second = (component as unknown as { loadNextPage: () => Promise<void> }).loadNextPage();
    expect(component.isFetchingMore()).toBe(true);
    subject.complete();
    await first;
    await second;
    expect(component.isFetchingMore()).toBe(false);
  });

  it('does not paginate while a type filter is active', async () => {
    byTypeUseCase.setResponse({
      count: 1,
      nextOffset: null,
      results: [{ id: 4, name: 'charmander', imageUrl: 'x', types: [{ name: 'fire', url: 'u' }] }],
    });
    fixture.detectChanges();
    component.ionViewWillEnter();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
    component.onSelectType('fire');
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
    const before = component.items().length;
    await (component as unknown as { loadNextPage: () => Promise<void> }).loadNextPage();
    expect(component.items().length).toBe(before);
  });

  it('capitalizes and formats ids', () => {
    expect(component.capitalize('pikachu')).toBe('Pikachu');
    expect(component.formatId(25)).toBe('025');
  });

  it('reports whether a list item has any type', () => {
    const withTypes = { id: 1, name: 'a', imageUrl: 'x', types: [{ name: 'fire' as never, url: 'u' }] };
    const withoutTypes = { id: 2, name: 'b', imageUrl: 'x', types: [] };
    expect(component.hasAnyType(withTypes)).toBe(true);
    expect(component.hasAnyType(withoutTypes)).toBe(false);
  });

  describe('infinite scroll trigger ((scroll) on .picker-scroll)', () => {
    function makeScrollEvent(
      scrollTop: number,
      scrollHeight: number,
      clientHeight: number,
    ): Event {
      const target = {
        scrollTop,
        scrollHeight,
        clientHeight,
      } as unknown as HTMLElement;
      const event = new Event('scroll');
      Object.defineProperty(event, 'currentTarget', { value: target });
      return event;
    }

    it('triggers loadNextPage when scrolling within 400px of the bottom', async () => {
      fixture.detectChanges();
      component.ionViewWillEnter();
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
      fixture.detectChanges();
      const nextSpy = vi
        .spyOn(component as unknown as { loadNextPage: () => Promise<void> }, 'loadNextPage')
        .mockResolvedValue();
      component.onScroll(makeScrollEvent(800, 1000, 180));
      expect(nextSpy).toHaveBeenCalledTimes(1);
      nextSpy.mockRestore();
    });

    it('does not trigger loadNextPage when far from the bottom', async () => {
      fixture.detectChanges();
      component.ionViewWillEnter();
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
      fixture.detectChanges();
      const nextSpy = vi
        .spyOn(component as unknown as { loadNextPage: () => Promise<void> }, 'loadNextPage')
        .mockResolvedValue();
      component.onScroll(makeScrollEvent(100, 1000, 180));
      expect(nextSpy).not.toHaveBeenCalled();
      nextSpy.mockRestore();
    });

    it('ignores scroll events while loading the first page', async () => {
      fixture.detectChanges();
      component.ionViewWillEnter();
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
      const nextSpy = vi
        .spyOn(component as unknown as { loadNextPage: () => Promise<void> }, 'loadNextPage')
        .mockResolvedValue();
      component.onScroll(makeScrollEvent(0, 1000, 180));
      expect(nextSpy).not.toHaveBeenCalled();
      nextSpy.mockRestore();
    });

    it('throttles repeated near-bottom scroll events', async () => {
      fixture.detectChanges();
      component.ionViewWillEnter();
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
      fixture.detectChanges();
      const nextSpy = vi
        .spyOn(component as unknown as { loadNextPage: () => Promise<void> }, 'loadNextPage')
        .mockResolvedValue();
      component.onScroll(makeScrollEvent(800, 1000, 180));
      component.onScroll(makeScrollEvent(820, 1000, 180));
      component.onScroll(makeScrollEvent(840, 1000, 180));
      expect(nextSpy).toHaveBeenCalledTimes(1);
      nextSpy.mockRestore();
    });

    it('does not trigger when a type filter is active', async () => {
      byTypeUseCase.setResponse({
        count: 1,
        nextOffset: null,
        results: [{ id: 4, name: 'charmander', imageUrl: 'x', types: [{ name: 'fire', url: 'u' }] }],
      });
      fixture.detectChanges();
      component.ionViewWillEnter();
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
      fixture.detectChanges();
      component.onSelectType('fire');
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
      fixture.detectChanges();
      const nextSpy = vi
        .spyOn(component as unknown as { loadNextPage: () => Promise<void> }, 'loadNextPage')
        .mockResolvedValue();
      component.onScroll(makeScrollEvent(800, 1000, 180));
      expect(nextSpy).not.toHaveBeenCalled();
      nextSpy.mockRestore();
    });

    it('ignores events without a currentTarget (defensive)', async () => {
      fixture.detectChanges();
      component.ionViewWillEnter();
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
      fixture.detectChanges();
      const nextSpy = vi
        .spyOn(component as unknown as { loadNextPage: () => Promise<void> }, 'loadNextPage')
        .mockResolvedValue();
      component.onScroll(new Event('scroll'));
      expect(nextSpy).not.toHaveBeenCalled();
      nextSpy.mockRestore();
    });
  });
});
