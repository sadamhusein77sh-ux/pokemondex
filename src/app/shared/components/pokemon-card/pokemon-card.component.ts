import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { PokemonListItem } from '../../../core/models/pokemon-list.model';
import { POKEMON_TYPE_HEX, PokemonTypeName, PokemonTypeRef } from '../../../core/models/pokemon-type.model';
import { typeHexColor, typeContrastTextClass } from '../../../core/utils/type-color.mapper';

@Component({
  selector: 'app-pokemon-card',
  templateUrl: './pokemon-card.component.html',
  styleUrls: ['./pokemon-card.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokemonCardComponent {
  readonly pokemon = input.required<PokemonListItem>();
  readonly isFavorite = input<boolean>(false);
  readonly loading = input<boolean>(false);

  readonly open = output<PokemonListItem>();
  readonly toggleFavorite = output<PokemonListItem>();

  readonly displayName = computed(() => this.capitalize(this.pokemon().name));
  readonly primaryType = computed(() => this.pokemon().types[0] ?? null);
  readonly primaryTypeColor = computed(() =>
    typeHexColor(this.primaryType()?.name ?? null),
  );
  readonly primaryTypeClass = computed(() => {
    const name = this.primaryType()?.name as PokemonTypeName | undefined;
    return name ? `bg-type-${name}` : 'bg-type-normal';
  });
  readonly types = computed<ReadonlyArray<PokemonTypeRef>>(() => this.pokemon().types);

  readonly cardBackground = computed(() => {
    const color = this.primaryTypeColor();
    return `linear-gradient(140deg, ${color}26 0%, ${color}4D 100%)`;
  });

  readonly favoriteIcon = computed(() =>
    this.isFavorite() ? 'heart' : 'heart-outline',
  );
  readonly favoriteLabel = computed(() =>
    this.isFavorite() ? 'Remove from favorites' : 'Add to favorites',
  );

  onOpen(): void {
    if (this.loading()) {
      return;
    }
    this.open.emit(this.pokemon());
  }

  onToggleFavorite(event: Event): void {
    event.stopPropagation();
    if (this.loading()) {
      return;
    }
    this.toggleFavorite.emit(this.pokemon());
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement | null;
    if (!img) {
      return;
    }
    img.src = this.buildFallback(img.alt);
    img.onerror = null;
  }

  trackByType = (_: number, type: PokemonTypeRef): string => type.name;

  typeColor(name: string): string {
    return POKEMON_TYPE_HEX[name as PokemonTypeName] ?? '#A8A878';
  }

  typeTextClass(name: string): string {
    return typeContrastTextClass(name);
  }

  private capitalize(value: string): string {
    if (value.length === 0) {
      return value;
    }
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  private buildFallback(name: string): string {
    const stripped = name.replace(/[^a-z0-9]+/gi, '').toLowerCase();
    const safe = stripped.length > 0 ? stripped : 'pokemon';
    return `https://placehold.co/200x200/png?text=${safe}`;
  }
}
