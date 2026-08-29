import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared.module';
import { TeamPickerModalModule } from './team-picker-modal/team-picker-modal.module';
import { TeamPage } from './team.page';
import { TeamPageRoutingModule } from './team-routing.module';

@NgModule({
  imports: [SharedModule, TeamPickerModalModule, TeamPageRoutingModule],
  declarations: [TeamPage],
})
export class TeamPageModule {}
