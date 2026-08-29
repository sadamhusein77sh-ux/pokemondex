import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';

import { PokemonTypeName, POKEMON_TYPE_HEX } from '../../../core/models/pokemon-type.model';
import { typeHexColor } from '../../../core/utils/type-color.mapper';

export interface TeamSlotPokemon {
  readonly id: number;
  readonly name: string;
  readonly imageUrl: string;
  readonly types: ReadonlyArray<PokemonTypeName>;
}

const LONG_PRESS_MS = 500;

@Component({
  selector: 'app-team-slot',
  templateUrl: './team-slot.component.html',
  styleUrls: ['./team-slot.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamSlotComponent {
  readonly index = input.required<number>();
  readonly pokemon = input<TeamSlotPokemon | null>(null);
  readonly disabled = input<boolean>(false);
  readonly isFull = input<boolean>(false);

  readonly open = output<number>();
  readonly remove = output<number>();

  readonly pressed = signal<boolean>(false);

  readonly filled = computed(() => this.pokemon() !== null);

  readonly displayName = computed(() => {
    const p = this.pokemon();
    if (p === null) {
      return '';
    }
    return p.name.charAt(0).toUpperCase() + p.name.slice(1);
  });

  readonly slotLabel = computed(() =>
    this.filled()
      ? this.displayName()
      : this.isFull()
        ? 'Full'
        : 'Add',
  );

  readonly backgroundGradient = computed(() => {
    const p = this.pokemon();
    if (p === null || p.types.length === 0) {
      return 'linear-gradient(140deg, rgba(243,244,246,1) 0%, rgba(229,231,235,0.6) 100%)';
    }
    const color = typeHexColor(p.types[0] ?? null);
    return `linear-gradient(140deg, ${color}26 0%, ${color}4D 100%)`;
  });

  readonly ariaLabel = computed(() =>
    this.filled()
      ? `Slot ${this.index() + 1}: ${this.displayName()}. Long press to remove.`
      : this.isFull()
        ? `Slot ${this.index() + 1} is full.`
        : `Slot ${this.index() + 1} empty. Tap to add.`,
  );

  onClick(event: Event): void {
    const target = event.target as HTMLElement | null;
    if (target?.closest('[data-testid="team-slot-remove"]')) {
      return;
    }
    if (this.disabled()) {
      return;
    }
    this.open.emit(this.index());
  }

  onRemove(event: Event): void {
    event.stopPropagation();
    if (this.disabled()) {
      return;
    }
    this.remove.emit(this.index());
  }

  onPointerDown(event: PointerEvent): void {
    if (!this.filled() || this.disabled()) {
      return;
    }
    this.pressed.set(true);
    const target = event.currentTarget as HTMLElement;
    const release = (): void => {
      this.pressed.set(false);
      target.removeEventListener('pointerup', release);
      target.removeEventListener('pointercancel', release);
      target.removeEventListener('pointerleave', release);
    };
    target.addEventListener('pointerup', release);
    target.addEventListener('pointercancel', release);
    target.addEventListener('pointerleave', release);
    window.setTimeout(() => {
      if (this.pressed()) {
        this.remove.emit(this.index());
        this.pressed.set(false);
      }
    }, LONG_PRESS_MS);
  }

  typeColor(type: PokemonTypeName): string {
    return POKEMON_TYPE_HEX[type];
  }

  capitalize(value: string): string {
    if (value.length === 0) {
      return value;
    }
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  trackByType = (_: number, type: PokemonTypeName): string => type;
}
