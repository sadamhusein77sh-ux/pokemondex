import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared.module';
import { PokemonDetailModalModule } from '../detail/pokemon-detail-modal.module';
import { BrowsePage } from './browse.page';
import { BrowsePageRoutingModule } from './browse-routing.module';

@NgModule({
  imports: [SharedModule, PokemonDetailModalModule, BrowsePageRoutingModule],
  declarations: [BrowsePage],
})
export class BrowsePageModule {}