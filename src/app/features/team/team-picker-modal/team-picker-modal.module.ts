import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { SharedModule } from '../../../shared/shared.module';
import { TeamPickerModalComponent } from './team-picker-modal.component';

@NgModule({
  imports: [CommonModule, SharedModule],
  declarations: [TeamPickerModalComponent],
  exports: [TeamPickerModalComponent],
})
export class TeamPickerModalModule {}
