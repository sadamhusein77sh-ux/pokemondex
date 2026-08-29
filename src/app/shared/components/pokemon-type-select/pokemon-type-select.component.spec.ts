import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

import {
  PokemonTypeSelectComponent,
} from './pokemon-type-select.component';

describe('PokemonTypeSelectComponent', () => {
  let fixture: ComponentFixture<PokemonTypeSelectComponent>;
  let component: PokemonTypeSelectComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PokemonTypeSelectComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    });

    fixture = TestBed.createComponent(PokemonTypeSelectComponent);
    component = fixture.componentInstance;
  });

  it('renders "All types" as the placeholder by default', () => {
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector(
      '[data-testid="pokemon-type-select-trigger"]',
    ) as HTMLElement | null;
    expect(trigger?.getAttribute('placeholder')).toBe('All types');
    expect(component.selected()).toBeNull();
  });

  it('reflects the selected type on the ion-select value', () => {
    fixture.componentRef.setInput('selected', 'fire');
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector(
      '[data-testid="pokemon-type-select-trigger"]',
    ) as (HTMLElement & { value?: string }) | null;
    expect(trigger?.value).toBe('fire');
  });

  it('renders an option for every Pokemon type plus "All types"', () => {
    fixture.detectChanges();
    const options = fixture.nativeElement.querySelectorAll('ion-select-option');
    expect(options.length).toBe(19);
    const allOption = fixture.nativeElement.querySelector(
      '[data-testid="pokemon-type-select-all"]',
    );
    expect(allOption).toBeTruthy();
    const fireOption = fixture.nativeElement.querySelector(
      '[data-testid="pokemon-type-select-fire"]',
    );
    expect(fireOption).toBeTruthy();
  });

  it('emits the picked type when onChange receives a value', () => {
    fixture.detectChanges();
    const emitted: (string | null)[] = [];
    component.typeChange.subscribe((value) => emitted.push(value));

    component.onChange({ detail: { value: 'fire' } } as unknown as CustomEvent);

    expect(emitted).toEqual(['fire']);
  });

  it('emits null when "All types" is picked', () => {
    fixture.detectChanges();
    const emitted: (string | null)[] = [];
    component.typeChange.subscribe((value) => emitted.push(value));

    component.onChange({ detail: { value: null } } as unknown as CustomEvent);

    expect(emitted).toEqual([null]);
  });

  it('emits null when the change payload has no detail', () => {
    fixture.detectChanges();
    const emitted: (string | null)[] = [];
    component.typeChange.subscribe((value) => emitted.push(value));

    component.onChange({} as Event);

    expect(emitted).toEqual([null]);
  });
});
