import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

import { ErrorStateComponent } from './error-state.component';

describe('ErrorStateComponent', () => {
  let fixture: ComponentFixture<ErrorStateComponent>;
  let component: ErrorStateComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ErrorStateComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    });

    fixture = TestBed.createComponent(ErrorStateComponent);
    component = fixture.componentInstance;
  });

  it('renders title and message', () => {
    fixture.componentRef.setInput('title', 'Network error');
    fixture.componentRef.setInput('message', 'Try again later.');
    fixture.detectChanges();

    const root = fixture.nativeElement.querySelector('[data-testid="error-state"]');
    expect(root.textContent).toContain('Network error');
    expect(root.textContent).toContain('Try again later.');
  });

  it('emits retry when the button is clicked', () => {
    const emitted: void[] = [];
    component.retry.subscribe(() => emitted.push(undefined));
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector(
      '[data-testid="error-state-retry"]',
    ) as HTMLButtonElement;
    button.click();

    expect(emitted.length).toBe(1);
  });
});
