import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared.module';
import { PokemonDetailModalModule } from '../detail/pokemon-detail-modal.module';
import { FavoritesPage } from './favorites.page';
import { FavoritesPageRoutingModule } from './favorites-routing.module';

@NgModule({
  imports: [SharedModule, PokemonDetailModalModule, FavoritesPageRoutingModule],
  declarations: [FavoritesPage],
})
export class FavoritesPageModule {}
