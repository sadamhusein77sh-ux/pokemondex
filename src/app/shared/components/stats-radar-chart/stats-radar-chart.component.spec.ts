import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

import { StatsRadarChartComponent } from './stats-radar-chart.component';
import { TeamStatTotals } from '../../../core/models/team.model';

const sample: TeamStatTotals = {
  hp: 100,
  attack: 110,
  defense: 90,
  specialAttack: 120,
  specialDefense: 95,
  speed: 105,
  total: 620,
};

describe('StatsRadarChartComponent', () => {
  let fixture: ComponentFixture<StatsRadarChartComponent>;
  let component: StatsRadarChartComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [StatsRadarChartComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    });
    fixture = TestBed.createComponent(StatsRadarChartComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('stats', sample);
  });

  it('renders 4 grid rings by default', () => {
    fixture.detectChanges();
    expect(component.gridLines().length).toBe(4);
  });

  it('renders axis labels for all six stats', () => {
    fixture.detectChanges();
    expect(component.labelPoints().length).toBe(6);
  });

  it('renders the data polygon when stats are non-zero', () => {
    fixture.detectChanges();
    expect(component.hasData()).toBe(true);
    expect(component.dataPolygon().length).toBeGreaterThan(0);
  });

  it('does not draw a polygon when stats are zero', () => {
    fixture.componentRef.setInput('stats', {
      ...sample,
      hp: 0,
      attack: 0,
      defense: 0,
      specialAttack: 0,
      specialDefense: 0,
      speed: 0,
    });
    fixture.detectChanges();
    expect(component.hasData()).toBe(false);
  });

  it('scales the chart size based on the size input', () => {
    fixture.componentRef.setInput('size', 220);
    fixture.detectChanges();
    expect(component.size()).toBe(220);
    expect(component.radius()).toBeGreaterThan(0);
  });

  it('clamps a positive radius even when size is small', () => {
    fixture.componentRef.setInput('size', 16);
    fixture.detectChanges();
    expect(component.radius()).toBe(0);
  });
});
