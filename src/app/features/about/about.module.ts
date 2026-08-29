import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared.module';
import { AboutPage } from './about.page';
import { AboutPageRoutingModule } from './about-routing.module';

@NgModule({
  imports: [SharedModule, AboutPageRoutingModule],
  declarations: [AboutPage],
})
export class AboutPageModule {}
