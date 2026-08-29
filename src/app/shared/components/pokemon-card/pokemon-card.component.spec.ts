import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

import { PokemonCardComponent } from './pokemon-card.component';
import { PokemonListItem } from '../../../core/models/pokemon-list.model';

const sample: PokemonListItem = {
  id: 25,
  name: 'pikachu',
  imageUrl: 'https://example.test/pikachu.png',
  types: [{ name: 'electric', url: 'x' }],
};

describe('PokemonCardComponent', () => {
  let fixture: ComponentFixture<PokemonCardComponent>;
  let component: PokemonCardComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PokemonCardComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    });

    fixture = TestBed.createComponent(PokemonCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('pokemon', sample);
  });

  it('renders the capitalized name', () => {
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Pikachu');
  });

  it('renders the primary type color tint on the image background', () => {
    fixture.detectChanges();
    expect(component.primaryTypeColor()).toBeTruthy();
    expect(component.primaryType()).toBeTruthy();
    const imageContainer = fixture.nativeElement.querySelector(
      '[data-testid="pokemon-card-25"] [style*="background"]',
    );
    expect(imageContainer).toBeTruthy();
  });

  it('renders a diagonal gradient based on the primary type color', () => {
    fixture.detectChanges();
    const gradient = component.cardBackground();
    expect(gradient).toContain('linear-gradient(140deg');
    expect(gradient).toContain(component.primaryTypeColor());
  });

  it('falls back to normal-type color when no types are listed', () => {
    fixture.componentRef.setInput('pokemon', { ...sample, types: [] });
    fixture.detectChanges();
    expect(component.primaryTypeColor()).toBeTruthy();
    expect(component.primaryTypeClass()).toBe('bg-type-normal');
  });

  it('emits open when the card is clicked', () => {
    fixture.detectChanges();
    const opened: PokemonListItem[] = [];
    component.open.subscribe((pokemon) => opened.push(pokemon));
    const card = fixture.nativeElement.querySelector(
      '[data-testid="pokemon-card-25"]',
    ) as HTMLButtonElement;
    card.click();
    expect(opened).toEqual([sample]);
  });

  it('emits toggleFavorite without emitting open when the heart is clicked', () => {
    fixture.detectChanges();
    const opened: PokemonListItem[] = [];
    const toggled: PokemonListItem[] = [];
    component.open.subscribe((p) => opened.push(p));
    component.toggleFavorite.subscribe((p) => toggled.push(p));

    const heart = fixture.nativeElement.querySelector(
      '[data-testid="pokemon-card-favorite"]',
    ) as HTMLButtonElement;
    heart.click();

    expect(toggled).toEqual([sample]);
    expect(opened).toEqual([]);
  });

  it('renders the filled heart when favorited', () => {
    fixture.componentRef.setInput('isFavorite', true);
    fixture.detectChanges();
    expect(component.favoriteIcon()).toBe('heart');
    expect(component.favoriteLabel()).toBe('Remove from favorites');
  });

  it('renders the outline heart when not favorited', () => {
    fixture.componentRef.setInput('isFavorite', false);
    fixture.detectChanges();
    expect(component.favoriteIcon()).toBe('heart-outline');
    expect(component.favoriteLabel()).toBe('Add to favorites');
  });

  it('does not emit when loading is true', () => {
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();
    const opened: PokemonListItem[] = [];
    component.open.subscribe((p) => opened.push(p));
    const card = fixture.nativeElement.querySelector(
      '[data-testid="pokemon-card-25"]',
    ) as HTMLButtonElement;
    card.click();
    expect(opened).toEqual([]);
  });

  it('renders a type pill per Pokemon type', () => {
    fixture.componentRef.setInput('pokemon', {
      ...sample,
      types: [
        { name: 'fire', url: 'x' },
        { name: 'flying', url: 'y' },
      ],
    });
    fixture.detectChanges();
    const fire = fixture.nativeElement.querySelector(
      '[data-testid="pokemon-card-type-fire"]',
    ) as HTMLElement;
    const flying = fixture.nativeElement.querySelector(
      '[data-testid="pokemon-card-type-flying"]',
    ) as HTMLElement;
    expect(fire).toBeTruthy();
    expect(flying).toBeTruthy();
    expect(component.types().length).toBe(2);
  });

  it('does not render the Pokedex ID watermark', () => {
    fixture.componentRef.setInput('pokemon', { ...sample, id: 25 });
    fixture.detectChanges();
    const watermark = fixture.nativeElement.querySelector(
      '[data-testid="pokemon-card-id"]',
    );
    expect(watermark).toBeNull();
  });

  it('returns the type color for known types and a fallback for unknown', () => {
    expect(component.typeColor('fire')).toBe('#F08030');
    expect(component.typeColor('unknown-type')).toBe('#A8A878');
  });

  it('returns a contrast-aware text class per type', () => {
    expect(component.typeTextClass('fire')).toBe('text-white');
    expect(component.typeTextClass('electric')).toBe('text-gray-900');
    expect(component.typeTextClass('ice')).toBe('text-gray-900');
    expect(component.typeTextClass('unknown-type')).toBe('text-gray-900');
  });

  describe('image loading state', () => {
    function getImage(): HTMLImageElement {
      return fixture.nativeElement.querySelector(
        '[data-testid="pokemon-card-image"]',
      ) as HTMLImageElement;
    }

    function getSkeleton(): HTMLElement | null {
      return fixture.nativeElement.querySelector(
        '[data-testid="pokemon-card-image-skeleton"]',
      );
    }

    it('shows the skeleton placeholder before the image loads', () => {
      fixture.detectChanges();
      expect(getSkeleton()).toBeTruthy();
      expect(component['imageLoaded']()).toBe(false);
      expect(component['imageErrored']()).toBe(false);
      expect(component.showImageSkeleton()).toBe(true);
    });

    it('hides the skeleton and reveals the image after the load event', () => {
      fixture.detectChanges();
      const img = getImage();
      img.dispatchEvent(new Event('load'));
      fixture.detectChanges();
      expect(getSkeleton()).toBeNull();
      expect(component['imageLoaded']()).toBe(true);
      expect(component.showImageSkeleton()).toBe(false);
    });

    it('hides the skeleton and reveals the fallback image after an error', () => {
      fixture.detectChanges();
      const img = getImage();
      img.dispatchEvent(new Event('error'));
      fixture.detectChanges();
      expect(component['imageErrored']()).toBe(true);
      expect(component.showImageSkeleton()).toBe(false);
      expect(getSkeleton()).toBeNull();
    });

    it('renders the fallback placeholder URL when the image fails to load', () => {
      fixture.detectChanges();
      const img = getImage();
      img.dispatchEvent(new Event('error'));
      expect(img.src).toContain('placehold.co');
    });
  });

  describe('priority hint', () => {
    function getImage(): HTMLImageElement {
      return fixture.nativeElement.querySelector(
        '[data-testid="pokemon-card-image"]',
      ) as HTMLImageElement;
    }

    it('defaults to lazy loading when priority is not set', () => {
      fixture.detectChanges();
      const img = getImage();
      expect(img.getAttribute('loading')).toBe('lazy');
      expect(img.getAttribute('fetchpriority')).toBeNull();
    });

    it('uses eager + high fetchpriority when priority is true', () => {
      fixture.componentRef.setInput('priority', true);
      fixture.detectChanges();
      const img = getImage();
      expect(img.getAttribute('loading')).toBe('eager');
      expect(img.getAttribute('fetchpriority')).toBe('high');
    });

    it('exposes priority-derived signals correctly', () => {
      fixture.componentRef.setInput('priority', true);
      fixture.detectChanges();
      expect(component.imageLoadingAttr()).toBe('eager');
      expect(component.imageFetchPriority()).toBe('high');

      fixture.componentRef.setInput('priority', false);
      fixture.detectChanges();
      expect(component.imageLoadingAttr()).toBe('lazy');
      expect(component.imageFetchPriority()).toBeNull();
    });
  });
});
