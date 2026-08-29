import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { TypeDefensiveCoverage } from '../../../core/utils/type-effectiveness';
import { PokemonTypeName, POKEMON_TYPE_HEX } from '../../../core/models/pokemon-type.model';
import { typeHexColor } from '../../../core/utils/type-color.mapper';

export interface CoverageRow {
  readonly bucket:
    | 'immune'
    | 'quad-resist'
    | 'resist'
    | 'neutral'
    | 'weak'
    | 'quad-weak';
  readonly label: string;
  readonly icon: string;
  readonly tone: 'positive' | 'negative' | 'neutral';
  readonly types: ReadonlyArray<{ name: PokemonTypeName; color: string; label: string }>;
}

const EMPTY_BUCKET_TYPES: ReadonlyArray<PokemonTypeName> = [];

@Component({
  selector: 'app-type-coverage-panel',
  templateUrl: './type-coverage-panel.component.html',
  styleUrls: ['./type-coverage-panel.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TypeCoveragePanelComponent {
  readonly coverage = input.required<TypeDefensiveCoverage>();
  readonly hasTeam = input<boolean>(false);

  readonly rows = computed<ReadonlyArray<CoverageRow>>(() => {
    const data = this.coverage();
    const buildTypes = (list: ReadonlyArray<PokemonTypeName>) =>
      list.map((name) => ({
        name,
        color: typeHexColor(name),
        label: this.format(name),
      }));

    return [
      {
        bucket: 'immune',
        label: 'Immune',
        icon: 'shield-checkmark-outline',
        tone: 'positive',
        types: buildTypes(data.immune),
      },
      {
        bucket: 'quad-resist',
        label: 'Quad resists',
        icon: 'shield-half-outline',
        tone: 'positive',
        types: buildTypes(data.quadResist),
      },
      {
        bucket: 'resist',
        label: 'Resists',
        icon: 'shield-outline',
        tone: 'positive',
        types: buildTypes(data.resist),
      },
      {
        bucket: 'neutral',
        label: 'Neutral',
        icon: 'remove-outline',
        tone: 'neutral',
        types: buildTypes(data.neutral),
      },
      {
        bucket: 'weak',
        label: 'Weak to',
        icon: 'alert-circle-outline',
        tone: 'negative',
        types: buildTypes(data.weak),
      },
      {
        bucket: 'quad-weak',
        label: 'Quad weak',
        icon: 'flame-outline',
        tone: 'negative',
        types: buildTypes(data.quadWeak),
      },
    ];
  });

  readonly visibleRows = computed<ReadonlyArray<CoverageRow>>(() =>
    this.hasTeam()
      ? this.rows().filter((row) => row.types.length > 0)
      : this.rows(),
  );

  readonly emptyTypes = EMPTY_BUCKET_TYPES;

  trackByBucket = (_: number, row: CoverageRow): string => row.bucket;

  trackByType = (_: number, type: { name: PokemonTypeName }): string => type.name;

  format(name: PokemonTypeName): string {
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  readonly hexFor = (name: PokemonTypeName): string => POKEMON_TYPE_HEX[name];
}
