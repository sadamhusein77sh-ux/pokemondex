import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';

import { GetFavoritesUseCase } from '../application/favorites/favorites.usecases';
import { GetTeamUseCase } from '../application/team/team.usecases';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabsPage implements OnInit, OnDestroy {
  private readonly getFavorites: GetFavoritesUseCase = inject(GetFavoritesUseCase);
  private readonly getTeam: GetTeamUseCase = inject(GetTeamUseCase);

  readonly favoritesCount = signal<number>(0);
  readonly teamCount = signal<number>(0);

  private favoritesSubscription?: Subscription;
  private teamSubscription?: Subscription;

  ngOnInit(): void {
    this.favoritesSubscription = this.getFavorites
      .execute()
      .subscribe((ids: ReadonlyArray<number>) => {
        this.favoritesCount.set(ids.length);
      });
    this.teamSubscription = this.getTeam.execute().subscribe((slots) => {
      this.teamCount.set(slots.length);
    });
  }

  ngOnDestroy(): void {
    this.favoritesSubscription?.unsubscribe();
    this.teamSubscription?.unsubscribe();
  }
}