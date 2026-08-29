import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { TeamStatTotals } from '../../../core/models/team.model';
import { statDisplayLabel } from '../../../core/utils/stat-name.mapper';

export interface StatsRadarAxis {
  readonly key: keyof TeamStatTotals;
  readonly label: string;
}

interface RadarPoint {
  readonly axis: number;
  readonly value: number;
}

interface RadarLabelPoint extends RadarPoint {
  readonly label: string;
}

const RADAR_AXES: ReadonlyArray<StatsRadarAxis> = [
  { key: 'hp', label: statDisplayLabel('hp') },
  { key: 'attack', label: statDisplayLabel('attack') },
  { key: 'defense', label: statDisplayLabel('defense') },
  { key: 'specialAttack', label: statDisplayLabel('special-attack') },
  { key: 'specialDefense', label: statDisplayLabel('special-defense') },
  { key: 'speed', label: statDisplayLabel('speed') },
];

const RADAR_RINGS = 4;
const RADAR_MAX_PER_STAT = 255;
const RADAR_PADDING = 24;

@Component({
  selector: 'app-stats-radar-chart',
  templateUrl: './stats-radar-chart.component.html',
  styleUrls: ['./stats-radar-chart.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatsRadarChartComponent {
  readonly stats = input.required<TeamStatTotals>();
  readonly size = input<number>(180);
  readonly maxPerStat = input<number>(RADAR_MAX_PER_STAT);

  readonly axes = computed<ReadonlyArray<StatsRadarAxis>>(() => RADAR_AXES);

  readonly radius = computed(() => Math.max(0, this.size() / 2 - RADAR_PADDING));

  readonly gridLines = computed<ReadonlyArray<string>>(() => {
    const axes = this.axes();
    const rings = RADAR_RINGS;
    const radius = this.radius();
    return Array.from({ length: rings }, (_, ringIndex) => {
      const factor = (ringIndex + 1) / rings;
      const ringRadius = radius * factor;
      return axes
        .map((_, axisIndex) =>
          this.computePoint(axisIndex, axes.length, ringRadius),
        )
        .map((point) => `${point.axis},${point.value}`)
        .join(' ');
    });
  });

  readonly dataPoints = computed<ReadonlyArray<RadarPoint>>(() => {
    const axes = this.axes();
    const stats = this.stats();
    const max = this.maxPerStat();
    const radius = this.radius();
    return axes.map((axis, index) => {
      const rawValue = stats[axis.key] as number;
      const ratio = max > 0 ? Math.max(0, Math.min(1, rawValue / max)) : 0;
      return this.computePoint(index, axes.length, radius * ratio);
    });
  });

  readonly dataPolygon = computed<string>(() =>
    this.dataPoints()
      .map((point) => `${point.axis},${point.value}`)
      .join(' '),
  );

  readonly hasData = computed(() =>
    this.dataPoints().some(
      (point) => Math.abs(point.axis - this.center()) > 0.5 || Math.abs(point.value - this.center()) > 0.5,
    ),
  );

  readonly labelPoints = computed<ReadonlyArray<RadarLabelPoint>>(() => {
    const axes = this.axes();
    const radius = this.radius();
    const labelRadius = radius + 12;
    return axes.map((axis, index) => {
      const point = this.computePoint(index, axes.length, labelRadius);
      return { ...point, label: axis.label };
    });
  });

  readonly viewBox = computed(() => `0 0 ${this.size()} ${this.size()}`);

  readonly center = computed(() => this.size() / 2);

  trackByIndex = (index: number): number => index;

  trackByAxis = (_: number, point: RadarLabelPoint): string => point.label;

  private computePoint(
    axisIndex: number,
    total: number,
    radius: number,
  ): RadarPoint {
    const angle = (Math.PI * 2 * axisIndex) / total - Math.PI / 2;
    const center = this.center();
    return {
      axis: center + radius * Math.cos(angle),
      value: center + radius * Math.sin(angle),
    };
  }
}
