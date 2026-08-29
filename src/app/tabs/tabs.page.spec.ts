import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, ReplaySubject, Subject } from 'rxjs';

import { TabsPage } from './tabs.page';
import { GetFavoritesUseCase } from '../application/favorites/favorites.usecases';
import { GetTeamUseCase } from '../application/team/team.usecases';

class MockGetFavorites implements Pick<GetFavoritesUseCase, 'execute'> {
  private readonly subject = new ReplaySubject<ReadonlyArray<number>>(1);
  execute(): Observable<ReadonlyArray<number>> {
    return this.subject.asObservable();
  }
  emit(ids: ReadonlyArray<number>): void {
    this.subject.next(ids);
  }
}

class MockGetTeam implements Pick<GetTeamUseCase, 'execute'> {
  private readonly subject = new Subject<ReadonlyArray<{ index: number; pokemonId: number }>>();
  execute(): Observable<ReadonlyArray<{ index: number; pokemonId: number }>> {
    return this.subject.asObservable();
  }
  emit(slots: ReadonlyArray<{ index: number; pokemonId: number }>): void {
    this.subject.next(slots);
  }
}

describe('TabsPage', () => {
  let component: TabsPage;
  let fixture: ComponentFixture<TabsPage>;
  let favorites: MockGetFavorites;
  let team: MockGetTeam;

  beforeEach(async () => {
    favorites = new MockGetFavorites();
    team = new MockGetTeam();
    await TestBed.configureTestingModule({
      declarations: [TabsPage],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        { provide: GetFavoritesUseCase, useValue: favorites },
        { provide: GetTeamUseCase, useValue: team },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TabsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });

  it('renders 0 when there are no favorites', () => {
    favorites.emit([]);
    fixture.detectChanges();
    expect(component.favoritesCount()).toBe(0);
  });

  it('updates the badge count when favorites change', () => {
    favorites.emit([1, 2, 3]);
    fixture.detectChanges();
    expect(component.favoritesCount()).toBe(3);
    favorites.emit([1]);
    fixture.detectChanges();
    expect(component.favoritesCount()).toBe(1);
  });

  it('updates the team badge count when slots change', () => {
    team.emit([]);
    fixture.detectChanges();
    expect(component.teamCount()).toBe(0);
    team.emit([
      { index: 0, pokemonId: 1 },
      { index: 1, pokemonId: 2 },
      { index: 2, pokemonId: 3 },
    ]);
    fixture.detectChanges();
    expect(component.teamCount()).toBe(3);
  });
});