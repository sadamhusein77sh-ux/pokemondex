import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-pokemon-skeleton',
  templateUrl: './pokemon-skeleton.component.html',
  styleUrls: ['./pokemon-skeleton.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokemonSkeletonComponent {
  readonly count = input<number>(6);
  readonly placeholderArray = computed(() => Array.from({ length: this.count() }));
}
