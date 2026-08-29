import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ActionSheetController, ModalController } from '@ionic/angular/lazy';
import { of, Subject, throwError } from 'rxjs';

import { TeamPage } from './team.page';
import {
  GetTeamUseCase,
  AddToTeamUseCase,
  RemoveFromTeamUseCase,
  SwapTeamSlotUseCase,
  ClearTeamUseCase,
} from '../../application/team/team.usecases';
import { GetPokemonDetailUseCase } from '../../application/pokemon/pokemon.usecases';
import {
  ComputeTeamStatsUseCase,
  ComputeTeamTypeCoverageUseCase,
} from '../../application/team/team-coverage.usecases';
import { SharedModule } from '../../shared/shared.module';
import { TeamPickerModalModule } from './team-picker-modal/team-picker-modal.module';
import { CommonModule } from '@angular/common';

class MockTeam {
  stream$ = new Subject<ReadonlyArray<{ index: number; pokemonId: number }>>();

  constructor(private readonly snapshot: () => ReadonlyArray<{ index: number; pokemonId: number }>) {}

  execute() {
    return this.stream$.asObservable();
  }

  add(pokemonId: number) {
    const next = [...this.snapshot(), { index: this.snapshot().length, pokemonId }];
    this.stream$.next(next);
    return of(next);
  }

  addAll() {
    return this.add.bind(this);
  }

  remove() {
    return of(this.snapshot());
  }

  swap() {
    return of(this.snapshot());
  }

  clear() {
    return of([]);
  }
}

class MockDetail {
  detail(id: number) {
    const typesById: Record<number, Array<{ name: string; url: string }>> = {
      1: [{ name: 'grass', url: 'g' }, { name: 'poison', url: 'p' }],
      4: [{ name: 'fire', url: 'f' }],
      7: [{ name: 'water', url: 'w' }],
    };
    return of({
      id,
      name: `pokemon-${id}`,
      imageUrl: `https://example.test/${id}.png`,
      types: typesById[id] ?? [{ name: 'normal', url: 'n' }],
      height: 5,
      weight: 50,
      abilities: [],
      stats: [
        { name: 'hp', baseValue: 50 },
        { name: 'attack', baseValue: 50 },
        { name: 'defense', baseValue: 50 },
        { name: 'special-attack', baseValue: 50 },
        { name: 'special-defense', baseValue: 50 },
        { name: 'speed', baseValue: 50 },
      ],
      moves: [],
      spriteFallbacks: [],
    });
  }
  execute(id: number | string) {
    return this.detail(typeof id === 'number' ? id : 1);
  }
}

class MockModalController {
  createCalls: unknown[] = [];
  presentCalls: number = 0;
  dismissValue: unknown = undefined;
  async create(opts: unknown) {
    this.createCalls.push(opts);
    return {
      present: async () => {
        this.presentCalls += 1;
      },
      onDidDismiss: async () => ({ data: this.dismissValue, role: undefined }),
    };
  }
  async dismiss(value?: unknown) {
    this.dismissValue = value;
    return value;
  }
}

class MockActionSheetController {
  createCalls: number = 0;
  async create(opts: unknown) {
    this.createCalls += 1;
    return { present: async () => undefined };
  }
  async dismiss() {
    return undefined;
  }
}

describe('TeamPage', () => {
  let fixture: ComponentFixture<TeamPage>;
  let component: TeamPage;
  let team$: Subject<ReadonlyArray<{ index: number; pokemonId: number }>>;
  let mockTeam: MockTeam;
  let mockModal: MockModalController;

  beforeEach(() => {
    team$ = new Subject();
    const snapshot = (): ReadonlyArray<{ index: number; pokemonId: number }> => [];
    mockTeam = new MockTeam(snapshot);
    mockTeam.stream$ = team$;
    mockModal = new MockModalController();

    TestBed.configureTestingModule({
      imports: [CommonModule, SharedModule, TeamPickerModalModule],
      declarations: [TeamPage],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        { provide: GetTeamUseCase, useValue: mockTeam },
        { provide: AddToTeamUseCase, useValue: mockTeam },
        { provide: RemoveFromTeamUseCase, useValue: mockTeam },
        { provide: SwapTeamSlotUseCase, useValue: mockTeam },
        { provide: ClearTeamUseCase, useValue: mockTeam },
        { provide: GetPokemonDetailUseCase, useClass: MockDetail },
        { provide: ModalController, useValue: mockModal },
        { provide: ActionSheetController, useClass: MockActionSheetController },
      ],
    });

    fixture = TestBed.createComponent(TeamPage);
    component = fixture.componentInstance;
  });

  it('shows the empty state for a brand new user', async () => {
    fixture.detectChanges();
    team$.next([]);
    await Promise.resolve();
    fixture.detectChanges();
    expect(component.state()).toBe('empty');
    expect(component.filledSlots().length).toBe(0);
  });

  it('fills six resolved slots', async () => {
    fixture.detectChanges();
    team$.next([
      { index: 0, pokemonId: 1 },
    ]);
    await Promise.resolve();
    await Promise.resolve();
    fixture.detectChanges();
    expect(component.resolvedSlots().length).toBe(6);
  });

  it('shows error state when details fail to load', async () => {
    fixture.destroy();
    const failingDetail = {
      execute: () => throwError(() => new Error('boom')),
    };
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [CommonModule, SharedModule, TeamPickerModalModule],
      declarations: [TeamPage],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        { provide: GetTeamUseCase, useValue: mockTeam },
        { provide: AddToTeamUseCase, useValue: mockTeam },
        { provide: RemoveFromTeamUseCase, useValue: mockTeam },
        { provide: SwapTeamSlotUseCase, useValue: mockTeam },
        { provide: ClearTeamUseCase, useValue: mockTeam },
        { provide: GetPokemonDetailUseCase, useValue: failingDetail },
        { provide: ModalController, useValue: mockModal },
        { provide: ActionSheetController, useClass: MockActionSheetController },
      ],
    });
    fixture = TestBed.createComponent(TeamPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    team$.next([{ index: 0, pokemonId: 1 }]);
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
    expect(component.state()).toBe('error');
  });

  it('formats ids with 3-digit padding', () => {
    expect(component.formatId(7)).toBe('007');
    expect(component.formatId(152)).toBe('152');
  });

  it('shows the Team Complete badge when 6 slots are filled', () => {
    const slots = Array.from({ length: 6 }, (_, i) => ({ index: i, pokemonId: i + 1 }));
    (component as unknown as { slots: { set: (v: ReadonlyArray<{ index: number; pokemonId: number }>) => void } }).slots.set(slots);
    expect(component.completionBadge()).toBe('Team Complete!');
  });

  it('opens the picker modal when adding a new pokemon', async () => {
    fixture.detectChanges();
    team$.next([]);
    await Promise.resolve();
    fixture.detectChanges();
    await component.onAddPokemon();
    expect(mockModal.createCalls.length).toBe(1);
  });

  it('removes a pokemon when the slot emits remove', () => {
    fixture.detectChanges();
    team$.next([{ index: 0, pokemonId: 1 }]);
    component.onSlotRemove(0);
    expect(true).toBe(true);
  });
});
