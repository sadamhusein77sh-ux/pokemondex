import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular/lazy';

import { EmptyStateComponent } from './components/empty-state/empty-state.component';
import { ErrorStateComponent } from './components/error-state/error-state.component';
import { MovesModalComponent } from './components/moves-modal/moves-modal.component';
import { PokemonCardComponent } from './components/pokemon-card/pokemon-card.component';
import { PokemonSkeletonComponent } from './components/pokemon-skeleton/pokemon-skeleton.component';
import { PokemonStatsComponent } from './components/pokemon-stats/pokemon-stats.component';
import { PokemonTypeSelectComponent } from './components/pokemon-type-select/pokemon-type-select.component';
import { StatsRadarChartComponent } from './components/stats-radar-chart/stats-radar-chart.component';
import { TeamSlotComponent } from './components/team-slot/team-slot.component';
import { TypeCoveragePanelComponent } from './components/type-coverage-panel/type-coverage-panel.component';

const declarations = [
  EmptyStateComponent,
  ErrorStateComponent,
  MovesModalComponent,
  PokemonCardComponent,
  PokemonSkeletonComponent,
  PokemonStatsComponent,
  PokemonTypeSelectComponent,
  StatsRadarChartComponent,
  TeamSlotComponent,
  TypeCoveragePanelComponent,
];

@NgModule({
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, IonicModule],
  declarations,
  exports: [...declarations, CommonModule, FormsModule, ReactiveFormsModule, RouterModule, IonicModule],
})
export class SharedModule {}