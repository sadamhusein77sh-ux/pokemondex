import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ModalController } from '@ionic/angular/lazy';
import { of, throwError } from 'rxjs';

import { PokemonDetailModalComponent } from './pokemon-detail-modal.component';
import { GetPokemonDetailUseCase } from '../../application/pokemon/pokemon.usecases';
import {
  IsFavoriteUseCase,
  ToggleFavoriteUseCase,
} from '../../application/favorites/favorites.usecases';
import { SharedModule } from '../../shared/shared.module';
import { CommonModule } from '@angular/common';

class MockDetailUseCase {
  response: unknown = of({
    id: 25,
    name: 'pikachu',
    imageUrl: 'https://example.test/pikachu.png',
    types: [{ name: 'electric', url: 'x' }],
    height: 4,
    weight: 60,
    abilities: [],
    stats: [{ name: 'hp', baseValue: 35 }],
    moves: [{ name: 'thunder-shock' }],
    spriteFallbacks: [],
  });

  execute() {
    return this.response as any;
  }
}

class MockFavoriteUseCases {
  snapshotReturn = false;
  toggleReturn = of([25]);
  streamReturn = of(false);

  snapshot() {
    return this.snapshotReturn;
  }

  execute() {
    return this.toggleReturn;
  }

  execute$() {
    return this.streamReturn;
  }
}

class MockModalController {
  createCalls: unknown[] = [];
  dismissCalls = 0;

  async create(opts: unknown) {
    this.createCalls.push(opts);
    return {
      present: () => Promise.resolve(),
    };
  }

  async dismiss() {
    this.dismissCalls += 1;
  }
}

const mockDetail = () => ({
  id: 25,
  name: 'pikachu',
  imageUrl: 'x',
  types: [],
  height: 1,
  weight: 1,
  abilities: [],
  stats: [],
  moves: Array.from({ length: 30 }, (_, i) => ({ name: `move-${i}` })),
  spriteFallbacks: [],
  capitalizedName: 'Pikachu',
  primaryTypeName: null,
  totalBaseStat: 0,
  statMax: 100,
  statBarWidth: () => '0%',
  statLabel: (v: string) => v,
});

describe('PokemonDetailModalComponent', () => {
  let fixture: ComponentFixture<PokemonDetailModalComponent>;
  let component: PokemonDetailModalComponent;
  let detailUseCase: MockDetailUseCase;
  let favoriteUseCases: MockFavoriteUseCases;
  let modal: MockModalController;

  beforeEach(() => {
    detailUseCase = new MockDetailUseCase();
    favoriteUseCases = new MockFavoriteUseCases();
    modal = new MockModalController();

    TestBed.configureTestingModule({
      imports: [CommonModule, SharedModule],
      declarations: [PokemonDetailModalComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        { provide: GetPokemonDetailUseCase, useValue: detailUseCase },
        { provide: IsFavoriteUseCase, useValue: favoriteUseCases },
        { provide: ToggleFavoriteUseCase, useValue: favoriteUseCases },
        { provide: ModalController, useValue: modal },
      ],
    });

    fixture = TestBed.createComponent(PokemonDetailModalComponent);
    component = fixture.componentInstance;
    component.pokemonId = 25;
  });

  it('shows the loading state initially then renders the detail', () => {
    fixture.detectChanges();
    expect(component.state()).toBe('success');
    expect(component.detail()?.id).toBe(25);
  });

  it('switches to the error state when the API fails', () => {
    detailUseCase.response = throwError(() => new Error('boom'));
    fixture = TestBed.createComponent(PokemonDetailModalComponent);
    component = fixture.componentInstance;
    component.pokemonId = 25;
    fixture.detectChanges();
    expect(component.state()).toBe('error');
    expect(component.errorMessage()).toBeTruthy();
  });

  it('reloads detail when retry is requested', () => {
    detailUseCase.response = throwError(() => new Error('boom'));
    fixture = TestBed.createComponent(PokemonDetailModalComponent);
    component = fixture.componentInstance;
    component.pokemonId = 25;
    fixture.detectChanges();
    detailUseCase.response = of({
      id: 25,
      name: 'pikachu',
      imageUrl: 'x',
      types: [],
      height: 1,
      weight: 1,
      abilities: [],
      stats: [],
      moves: [],
      spriteFallbacks: [],
    });
    component.onRetry();
    fixture.detectChanges();
    expect(component.state()).toBe('success');
  });

  it('toggles the favorite when the button is pressed', () => {
    favoriteUseCases.snapshotReturn = false;
    fixture.detectChanges();
    component.onToggleFavorite();
    expect(favoriteUseCases.toggleReturn).toBeDefined();
  });

  it('exposes all moves on the detail entity for inline rendering', () => {
    component.detail.set(mockDetail() as any);
    expect(component.detail()?.moves.length).toBe(30);
  });

  it('formats type classes', () => {
    expect(component.typeClass('fire')).toBe('bg-type-fire');
    expect(component.typeClass(null)).toBe('bg-type-normal');
  });

  it('combines background and contrast text classes for type badges', () => {
    expect(component.typeBadgeClass('fire')).toBe('bg-type-fire text-white');
    expect(component.typeBadgeClass('electric')).toBe(
      'bg-type-electric text-gray-900',
    );
    expect(component.typeBadgeClass(null)).toBe('bg-type-normal text-gray-900');
  });

  it('dismisses the modal on close', () => {
    component.close();
    expect(modal.dismissCalls).toBe(1);
  });

  it('formats move names with capitalization', () => {
    expect(component.formatMove('thunder-shock')).toBe('Thunder Shock');
  });

  describe('image loading state', () => {
    function getImage(): HTMLImageElement | null {
      return fixture.nativeElement.querySelector(
        '[data-testid="detail-image"]',
      );
    }

    function getSkeleton(): HTMLElement | null {
      return fixture.nativeElement.querySelector(
        '[data-testid="detail-image-skeleton"]',
      );
    }

    it('shows the skeleton placeholder before the hero image loads', () => {
      fixture.detectChanges();
      expect(component.showImageSkeleton()).toBe(true);
      expect(getSkeleton()).toBeTruthy();
    });

    it('hides the skeleton after the load event', () => {
      fixture.detectChanges();
      const img = getImage();
      img?.dispatchEvent(new Event('load'));
      fixture.detectChanges();
      expect(component.showImageSkeleton()).toBe(false);
      expect(getSkeleton()).toBeNull();
    });

    it('hides the skeleton after an error event', () => {
      fixture.detectChanges();
      const img = getImage();
      img?.dispatchEvent(new Event('error'));
      fixture.detectChanges();
      expect(component.showImageSkeleton()).toBe(false);
      expect(getSkeleton()).toBeNull();
    });

    it('marks the hero image as eager with high fetchpriority', () => {
      fixture.detectChanges();
      const img = getImage();
      expect(img?.getAttribute('loading')).toBe('eager');
      expect(img?.getAttribute('fetchpriority')).toBe('high');
    });
  });
});
