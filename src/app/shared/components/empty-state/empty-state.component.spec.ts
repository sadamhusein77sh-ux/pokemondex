import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

import { EmptyStateComponent } from './empty-state.component';

describe('EmptyStateComponent', () => {
  let fixture: ComponentFixture<EmptyStateComponent>;
  let component: EmptyStateComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EmptyStateComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    });

    fixture = TestBed.createComponent(EmptyStateComponent);
    component = fixture.componentInstance;
  });

  it('renders title, message and action', () => {
    fixture.componentRef.setInput('title', 'No favorites');
    fixture.componentRef.setInput('message', 'Tap the heart on a Pokemon to add one.');
    fixture.componentRef.setInput('actionLabel', 'Browse Pokemon');
    fixture.detectChanges();

    const root = fixture.nativeElement.querySelector('[data-testid="empty-state"]');
    expect(root).toBeTruthy();
    expect(root.textContent).toContain('No favorites');
    expect(root.textContent).toContain('Browse Pokemon');
  });

  it('hides the action button when label is null', () => {
    fixture.componentRef.setInput('title', 'Empty');
    fixture.componentRef.setInput('actionLabel', null);
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('[data-testid="empty-state-action"]'),
    ).toBeNull();
  });

  it('emits action when the button is clicked', () => {
    fixture.componentRef.setInput('actionLabel', 'Retry');
    const emitted: void[] = [];
    component.action.subscribe(() => emitted.push(undefined));
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector(
      '[data-testid="empty-state-action"]',
    ) as HTMLButtonElement;
    button.click();

    expect(emitted.length).toBe(1);
  });
});
