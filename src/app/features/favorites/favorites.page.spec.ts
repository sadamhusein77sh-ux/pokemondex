import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ModalController } from '@ionic/angular/lazy';
import { of, Subject, throwError } from 'rxjs';

import { FavoritesPage } from './favorites.page';
import {
  GetFavoritesUseCase,
  ToggleFavoriteUseCase,
} from '../../application/favorites/favorites.usecases';
import { GetPokemonDetailUseCase } from '../../application/pokemon/pokemon.usecases';
import { SharedModule } from '../../shared/shared.module';
import { CommonModule } from '@angular/common';

class MockFavorites {
  stream$ = new Subject<ReadonlyArray<number>>();
  toggleReturn: any = of([1]);

  execute(...args: unknown[]): any {
    if (args.length === 0) {
      return this.stream$.asObservable();
    }
    return this.toggleReturn;
  }
}

class MockDetail {
  detail = {
    id: 1,
    name: 'bulbasaur',
    imageUrl: 'https://example.test/1.png',
    types: [{ name: 'grass', url: 'x' }],
  };
  execute() {
    return of(this.detail);
  }
}

class MockModalController {
  createCalls: unknown[] = [];
  async create(opts: unknown) {
    this.createCalls.push(opts);
    return { present: () => Promise.resolve() };
  }
}

describe('FavoritesPage', () => {
  let fixture: ComponentFixture<FavoritesPage>;
  let component: FavoritesPage;
  let favorites: MockFavorites;

  beforeEach(() => {
    favorites = new MockFavorites();
    TestBed.configureTestingModule({
      imports: [CommonModule, SharedModule],
      declarations: [FavoritesPage],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        { provide: GetFavoritesUseCase, useValue: favorites },
        { provide: ToggleFavoriteUseCase, useValue: favorites },
        { provide: GetPokemonDetailUseCase, useClass: MockDetail },
        { provide: ModalController, useClass: MockModalController },
      ],
    });

    fixture = TestBed.createComponent(FavoritesPage);
    component = fixture.componentInstance;
  });

  it('shows the empty state when there are no favorites', async () => {
    fixture.detectChanges();
    favorites.stream$.next([]);
    await Promise.resolve();
    fixture.detectChanges();
    expect(component.state()).toBe('empty');
    expect(component.items().length).toBe(0);
  });

  it('loads detail for every favorite', async () => {
    fixture.detectChanges();
    favorites.stream$.next([1]);
    await Promise.resolve();
    fixture.detectChanges();
    expect(component.state()).toBe('success');
    expect(component.items().length).toBe(1);
    expect(component.items()[0].name).toBe('bulbasaur');
  });

  it('switches to error state when the detail fetch fails', async () => {
    const detail = TestBed.inject(GetPokemonDetailUseCase) as any;
    detail.execute = () => throwError(() => new Error('boom'));
    fixture.detectChanges();
    favorites.stream$.next([1]);
    await Promise.resolve();
    expect(component.state()).toBe('error');
  });

  it('removes a favorite when toggled off', async () => {
    fixture.detectChanges();
    favorites.stream$.next([1]);
    await Promise.resolve();
    fixture.detectChanges();
    const item = component.items()[0];
    component.onToggleFavorite(item);
    await Promise.resolve();
    fixture.detectChanges();
    expect(component.state()).toBe('empty');
  });

  it('opens the detail modal when a favorite is tapped', async () => {
    fixture.detectChanges();
    favorites.stream$.next([1]);
    await Promise.resolve();
    fixture.detectChanges();
    const modal = TestBed.inject(ModalController) as any;
    const item = component.items()[0];
    await component.openDetail(item);
    expect(modal.createCalls.length).toBe(1);
  });
});
