import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  templateUrl: './empty-state.component.html',
  styleUrls: ['./empty-state.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateComponent {
  readonly title = input<string>('Nothing here yet');
  readonly message = input<string>('');
  readonly icon = input<string>('sad-outline');
  readonly actionLabel = input<string | null>(null);
  readonly action = output<void>();

  onAction(): void {
    this.action.emit();
  }
}
