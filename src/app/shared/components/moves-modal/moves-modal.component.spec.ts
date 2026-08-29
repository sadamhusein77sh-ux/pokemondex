import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

import { MovesModalComponent, MovesModalData } from './moves-modal.component';
import { MoveRef } from '../../../core/models/pokemon-detail.model';

describe('MovesModalComponent', () => {
  let fixture: ComponentFixture<MovesModalComponent>;
  let component: MovesModalComponent;

  const moves: MoveRef[] = Array.from({ length: 25 }, (_, i) => ({
    name: `move-${i + 1}`,
  }));

  const data: MovesModalData = {
    pokemonName: 'Pikachu',
    moves,
    limit: 20,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MovesModalComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    });

    fixture = TestBed.createComponent(MovesModalComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('data', data);
  });

  it('limits moves to the configured limit', () => {
    fixture.detectChanges();
    expect(component.visibleMoves().length).toBe(20);
  });

  it('reports when there are more moves to view', () => {
    fixture.detectChanges();
    expect(component.hasMore()).toBe(true);
  });

  it('reports no more moves when list is within limit', () => {
    fixture.componentRef.setInput('data', {
      ...data,
      moves: moves.slice(0, 10),
    });
    fixture.detectChanges();
    expect(component.hasMore()).toBe(false);
  });

  it('formats move names with capitalization', () => {
    expect(component.formatName('thunder-shock')).toBe('Thunder Shock');
    expect(component.formatName('pound')).toBe('Pound');
  });

  it('renders the empty state when there are no moves', () => {
    fixture.componentRef.setInput('data', { ...data, moves: [] });
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('No moves available.');
  });

  it('shows the move count summary', () => {
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('20 / 25');
  });
});
