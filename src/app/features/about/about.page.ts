import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-about-page',
  templateUrl: './about.page.html',
  styleUrls: ['./about.page.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutPage {
  readonly apiAttribution = 'Data provided by PokeAPI (https://pokeapi.co/).';
  readonly imageAttribution =
    'Official artwork sprites courtesy of the PokeAPI sprites repository.';
  readonly appVersion = '1.0.0';
}
