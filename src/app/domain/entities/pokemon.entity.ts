import {
  AbilityRef,
  MoveRef,
  PokemonDetail,
  StatRef,
} from '../../core/models/pokemon-detail.model';
import { statDisplayLabel } from '../../core/utils/stat-name.mapper';

const DEFAULT_STAT_MAX = 255;

export class PokemonDetailEntity implements PokemonDetail {
  readonly id: number;
  readonly name: string;
  readonly imageUrl: string;
  readonly types: PokemonDetail['types'];
  readonly height: number;
  readonly weight: number;
  readonly abilities: ReadonlyArray<AbilityRef>;
  readonly stats: ReadonlyArray<StatRef>;
  readonly moves: ReadonlyArray<MoveRef>;
  readonly spriteFallbacks: ReadonlyArray<string>;

  constructor(detail: PokemonDetail) {
    this.id = detail.id;
    this.name = detail.name;
    this.imageUrl = detail.imageUrl;
    this.types = detail.types;
    this.height = detail.height;
    this.weight = detail.weight;
    this.abilities = detail.abilities;
    this.stats = detail.stats;
    this.moves = detail.moves;
    this.spriteFallbacks = detail.spriteFallbacks;
  }

  get capitalizedName(): string {
    if (this.name.length === 0) {
      return this.name;
    }
    return this.name.charAt(0).toUpperCase() + this.name.slice(1);
  }

  get primaryTypeName(): string | null {
    const first = this.types[0];
    return first ? first.name : null;
  }

  get totalBaseStat(): number {
    return this.stats.reduce((sum, stat) => sum + stat.baseValue, 0);
  }

  get statMax(): number {
    let max = 0;
    for (const stat of this.stats) {
      if (stat.baseValue > max) {
        max = stat.baseValue;
      }
    }
    return max > 0 ? max : DEFAULT_STAT_MAX;
  }

  statBarWidth(baseValue: number, max?: number): string {
    const ceiling = max ?? this.statMax;
    if (ceiling <= 0) {
      return '0%';
    }
    const ratio = Math.max(0, Math.min(1, baseValue / ceiling));
    return `${(ratio * 100).toFixed(1)}%`;
  }

  statLabel(rawName: string): string {
    return statDisplayLabel(rawName);
  }
}
