import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { MoveRef } from '../../../core/models/pokemon-detail.model';

export interface MovesModalData {
  readonly pokemonName: string;
  readonly moves: ReadonlyArray<MoveRef>;
  readonly limit?: number;
}

@Component({
  selector: 'app-moves-modal',
  templateUrl: './moves-modal.component.html',
  styleUrls: ['./moves-modal.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MovesModalComponent {
  readonly data = input.required<MovesModalData>();
  readonly dismiss = output<void>();

  readonly visibleMoves = computed(() => {
    const limit = this.data().limit ?? 20;
    return this.data().moves.slice(0, limit);
  });

  readonly hasMore = computed(() => {
    const limit = this.data().limit ?? 20;
    return this.data().moves.length > limit;
  });

  formatName(name: string): string {
    return name
      .split('-')
      .map((part) =>
        part.length === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1),
      )
      .join(' ');
  }

  trackByName = (_: number, move: MoveRef): string => move.name;
}
