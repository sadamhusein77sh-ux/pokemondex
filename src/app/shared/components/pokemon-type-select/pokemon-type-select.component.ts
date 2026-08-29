import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';

import {
  POKEMON_TYPE_ORDER,
  POKEMON_TYPE_HEX,
  PokemonTypeName,
} from '../../../core/models/pokemon-type.model';

export interface PokemonTypeFilterOption {
  readonly name: PokemonTypeName;
  readonly color: string;
  readonly label: string;
}

export interface PokemonTypeSelectChange {
  readonly value: PokemonTypeName | null;
}

@Component({
  selector: 'app-pokemon-type-select',
  templateUrl: './pokemon-type-select.component.html',
  styleUrls: ['./pokemon-type-select.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokemonTypeSelectComponent {
  readonly selected = input<PokemonTypeName | null>(null);
  readonly typeChange = output<PokemonTypeName | null>();

  readonly options = computed<ReadonlyArray<PokemonTypeFilterOption>>(() =>
    POKEMON_TYPE_ORDER.map((name) => ({
      name,
      color: POKEMON_TYPE_HEX[name],
      label: this.format(name),
    })),
  );

  onChange(event: Event): void {
    const detail = (event as CustomEvent<PokemonTypeSelectChange>).detail;
    this.typeChange.emit(detail?.value ?? null);
  }

  trackByName = (_: number, option: PokemonTypeFilterOption): string => option.name;

  private format(name: string): string {
    return name.charAt(0).toUpperCase() + name.slice(1);
  }
}
