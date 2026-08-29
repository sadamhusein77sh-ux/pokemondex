import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

import { PokemonSkeletonComponent } from './pokemon-skeleton.component';

describe('PokemonSkeletonComponent', () => {
  let fixture: ComponentFixture<PokemonSkeletonComponent>;
  let component: PokemonSkeletonComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PokemonSkeletonComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    });

    fixture = TestBed.createComponent(PokemonSkeletonComponent);
    component = fixture.componentInstance;
  });

  it('renders the default number of placeholder cards', () => {
    fixture.detectChanges();
    const cards = fixture.nativeElement.querySelectorAll(
      '[data-testid="pokemon-skeleton-card"]',
    );
    expect(cards.length).toBe(6);
  });

  it('honors a custom count input', () => {
    fixture.componentRef.setInput('count', 4);
    fixture.detectChanges();
    const cards = fixture.nativeElement.querySelectorAll(
      '[data-testid="pokemon-skeleton-card"]',
    );
    expect(cards.length).toBe(4);
  });

  it('clamps the count to at least zero', () => {
    fixture.componentRef.setInput('count', 0);
    fixture.detectChanges();
    const cards = fixture.nativeElement.querySelectorAll(
      '[data-testid="pokemon-skeleton-card"]',
    );
    expect(cards.length).toBe(0);
    expect(component.count()).toBe(0);
  });
});
