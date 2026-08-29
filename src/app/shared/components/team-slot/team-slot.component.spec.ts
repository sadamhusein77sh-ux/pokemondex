import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

import { TeamSlotComponent, TeamSlotPokemon } from './team-slot.component';

const bulbasaur: TeamSlotPokemon = {
  id: 1,
  name: 'bulbasaur',
  imageUrl: 'https://example.test/bulbasaur.png',
  types: ['grass', 'poison'],
};

describe('TeamSlotComponent', () => {
  let fixture: ComponentFixture<TeamSlotComponent>;
  let component: TeamSlotComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TeamSlotComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    });
    fixture = TestBed.createComponent(TeamSlotComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('index', 0);
  });

  it('renders the empty state with the Add label', () => {
    fixture.detectChanges();
    expect(component.filled()).toBe(false);
    expect(component.slotLabel()).toBe('Add');
  });

  it('renders the empty Full label when the team is full', () => {
    fixture.componentRef.setInput('isFull', true);
    fixture.detectChanges();
    expect(component.slotLabel()).toBe('Full');
  });

  it('renders the filled state with the pokemon name', () => {
    fixture.componentRef.setInput('pokemon', bulbasaur);
    fixture.detectChanges();
    expect(component.filled()).toBe(true);
    expect(component.displayName()).toBe('Bulbasaur');
  });

  it('emits open with the slot index when clicked while empty', () => {
    fixture.detectChanges();
    const emits: number[] = [];
    component.open.subscribe((value) => emits.push(value));
    const root = fixture.nativeElement.querySelector(
      '[data-testid="team-slot-0"]',
    ) as HTMLButtonElement;
    root.click();
    expect(emits).toEqual([0]);
  });

  it('does not emit open when disabled', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    const emits: number[] = [];
    component.open.subscribe((value) => emits.push(value));
    const root = fixture.nativeElement.querySelector(
      '[data-testid="team-slot-0"]',
    ) as HTMLButtonElement;
    root.click();
    expect(emits).toEqual([]);
  });

  it('emits remove when the × is clicked on a filled slot', () => {
    fixture.componentRef.setInput('pokemon', bulbasaur);
    fixture.detectChanges();
    const removes: number[] = [];
    component.remove.subscribe((value) => removes.push(value));
    const remove = fixture.nativeElement.querySelector(
      '[data-testid="team-slot-remove"]',
    ) as HTMLButtonElement;
    remove.click();
    expect(removes).toEqual([0]);
  });

  it('does not emit open when the × is clicked', () => {
    fixture.componentRef.setInput('pokemon', bulbasaur);
    fixture.detectChanges();
    const opens: number[] = [];
    component.open.subscribe((value) => opens.push(value));
    const remove = fixture.nativeElement.querySelector(
      '[data-testid="team-slot-remove"]',
    ) as HTMLButtonElement;
    remove.click();
    expect(opens).toEqual([]);
  });

  it('reports the slot label through aria-label', () => {
    fixture.componentRef.setInput('pokemon', bulbasaur);
    fixture.detectChanges();
    expect(component.ariaLabel()).toContain('Bulbasaur');
  });

  it('returns the correct type color for known types', () => {
    expect(component.typeColor('fire')).toBe('#F08030');
  });

  it('renders the background gradient when a pokemon is present', () => {
    fixture.componentRef.setInput('pokemon', bulbasaur);
    fixture.detectChanges();
    expect(component.backgroundGradient()).toContain('linear-gradient');
  });
});
