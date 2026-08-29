import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

import { AboutPage } from './about.page';
import { SharedModule } from '../../shared/shared.module';
import { CommonModule } from '@angular/common';

describe('AboutPage', () => {
  let fixture: ComponentFixture<AboutPage>;
  let component: AboutPage;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CommonModule, SharedModule],
      declarations: [AboutPage],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    });

    fixture = TestBed.createComponent(AboutPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the app name and version', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Pokedex Mobile');
    expect(text).toContain('1.0.0');
  });

  it('credits PokeAPI', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('PokeAPI');
    expect(component.apiAttribution).toContain('PokeAPI');
  });
});
