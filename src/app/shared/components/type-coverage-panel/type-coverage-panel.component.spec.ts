import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

import { TypeCoveragePanelComponent } from './type-coverage-panel.component';
import { TypeDefensiveCoverage } from '../../../core/utils/type-effectiveness';

describe('TypeCoveragePanelComponent', () => {
  let fixture: ComponentFixture<TypeCoveragePanelComponent>;
  let component: TypeCoveragePanelComponent;

  const coverage: TypeDefensiveCoverage = {
    immune: [],
    quadResist: ['fire'],
    resist: ['water', 'ice'],
    neutral: ['normal'],
    weak: ['water', 'ground'],
    quadWeak: ['ground'],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TypeCoveragePanelComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    });
    fixture = TestBed.createComponent(TypeCoveragePanelComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('coverage', coverage);
    fixture.componentRef.setInput('hasTeam', true);
  });

  it('hides empty buckets when the team has members', () => {
    fixture.detectChanges();
    expect(component.visibleRows().length).toBe(5);
    expect(component.visibleRows().some((row) => row.bucket === 'immune')).toBe(false);
  });

  it('shows all buckets in the empty state', () => {
    fixture.componentRef.setInput('hasTeam', false);
    fixture.detectChanges();
    expect(component.visibleRows().length).toBe(6);
  });

  it('formats type names with capitalization', () => {
    expect(component.format('fire')).toBe('Fire');
  });

  it('returns the matching hex color for a type', () => {
    expect(component.hexFor('fire')).toBe('#F08030');
  });
});
