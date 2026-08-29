import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

import { PokemonStatsComponent } from './pokemon-stats.component';
import { StatRef } from '../../../core/models/pokemon-detail.model';

describe('PokemonStatsComponent', () => {
  let fixture: ComponentFixture<PokemonStatsComponent>;

  const stats: StatRef[] = [
    { name: 'hp', baseValue: 35 },
    { name: 'attack', baseValue: 55 },
    { name: 'speed', baseValue: 90 },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PokemonStatsComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    });

    fixture = TestBed.createComponent(PokemonStatsComponent);
    fixture.componentRef.setInput('stats', stats);
    fixture.componentRef.setInput('max', 100);
  });

  it('renders a bar for every stat', () => {
    fixture.detectChanges();
    const bars = fixture.nativeElement.querySelectorAll(
      '[data-testid="pokemon-stats-bar"]',
    );
    expect(bars.length).toBe(3);
  });

  it('formats width relative to max', () => {
    fixture.detectChanges();
    const bars = Array.from(
      fixture.nativeElement.querySelectorAll('[data-testid="pokemon-stats-bar"]'),
    ) as HTMLElement[];
    expect(bars[0].style.width).toMatch(/^35(\.\d+)?%$/);
    expect(bars[2].style.width).toMatch(/^90(\.\d+)?%$/);
  });

  it('caps width at 100%', () => {
    fixture.componentRef.setInput('stats', [{ name: 'hp', baseValue: 250 }]);
    fixture.componentRef.setInput('max', 100);
    fixture.detectChanges();
    const bar = fixture.nativeElement.querySelector(
      '[data-testid="pokemon-stats-bar"]',
    ) as HTMLElement | null;
    expect(bar?.style.width).toMatch(/^100(\.\d+)?%$/);
  });

  it('shows the total base stat', () => {
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Total');
    expect(text).toContain('180');
  });

  it('maps stat names to display labels', () => {
    fixture.componentRef.setInput('stats', [
      { name: 'special-attack', baseValue: 50 },
    ]);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Sp. Atk');
  });
});
