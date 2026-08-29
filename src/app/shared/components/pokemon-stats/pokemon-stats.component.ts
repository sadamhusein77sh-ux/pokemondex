import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { StatRef } from '../../../core/models/pokemon-detail.model';
import { statDisplayLabel } from '../../../core/utils/stat-name.mapper';

@Component({
  selector: 'app-pokemon-stats',
  templateUrl: './pokemon-stats.component.html',
  styleUrls: ['./pokemon-stats.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokemonStatsComponent {
  readonly stats = input.required<ReadonlyArray<StatRef>>();
  readonly max = input<number>(255);

  readonly bars = computed(() => {
    const ceiling = this.max() > 0 ? this.max() : 255;
    return this.stats().map((stat) => ({
      name: stat.name,
      label: statDisplayLabel(stat.name),
      value: stat.baseValue,
      width: `${Math.min(100, (stat.baseValue / ceiling) * 100).toFixed(1)}%`,
    }));
  });

  readonly total = computed(() =>
    this.stats().reduce((sum, stat) => sum + stat.baseValue, 0),
  );

  trackByName = (_: number, entry: { name: string }): string => entry.name;
}
