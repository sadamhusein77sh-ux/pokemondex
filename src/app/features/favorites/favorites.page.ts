import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { firstValueFrom, forkJoin, Subject, takeUntil } from 'rxjs';

import { ModalController } from '@ionic/angular/lazy';

import {
  GetFavoritesUseCase,
  ToggleFavoriteUseCase,
} from '../../application/favorites/favorites.usecases';
import { GetPokemonDetailUseCase } from '../../application/pokemon/pokemon.usecases';
import { PokemonDetailModalComponent } from '../detail/pokemon-detail-modal.component';

interface FavoriteRow {
  readonly id: number;
  readonly name: string;
  readonly imageUrl: string;
  readonly types: ReadonlyArray<{ name: string; url: string }>;
}

@Component({
  selector: 'app-favorites-page',
  templateUrl: './favorites.page.html',
  styleUrls: ['./favorites.page.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FavoritesPage implements OnInit, OnDestroy {
  private readonly getFavorites = inject(GetFavoritesUseCase);
  private readonly getDetail = inject(GetPokemonDetailUseCase);
  private readonly toggleFavorite = inject(ToggleFavoriteUseCase);
  private readonly modalController = inject(ModalController);

  readonly state = signal<'loading' | 'success' | 'empty' | 'error'>('loading');
  readonly items = signal<ReadonlyArray<FavoriteRow>>([]);
  readonly favoriteIds = signal<ReadonlyArray<number>>([]);
  readonly errorMessage = signal<string | null>(null);

  readonly idsKey = computed(() => this.favoriteIds().join(','));

  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.getFavorites
      .execute()
      .pipe(takeUntil(this.destroy$))
      .subscribe((ids) => {
        this.favoriteIds.set(ids);
        void this.loadFavorites(ids);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  isFavorite(item: FavoriteRow): boolean {
    return this.favoriteIds().includes(item.id);
  }

  async openDetail(item: FavoriteRow): Promise<void> {
    const modal = await this.modalController.create({
      component: PokemonDetailModalComponent,
      componentProps: { pokemonId: item.id },
      breakpoints: [0, 0.5, 0.95],
      initialBreakpoint: 0.95,
      expandToScroll: true,
    });
    await modal.present();
  }

  onToggleFavorite(item: FavoriteRow): void {
    this.toggleFavorite.execute(item.id).subscribe((next) => {
      this.favoriteIds.set(next);
      this.items.set(this.items().filter((row) => row.id !== item.id));
      if (this.items().length === 0) {
        this.state.set('empty');
      }
    });
  }

  onBrowse(): void {
    window.location.hash = '#/tabs/browse';
  }

  trackById = (_: number, item: FavoriteRow): number => item.id;

  private async loadFavorites(ids: ReadonlyArray<number>): Promise<void> {
    if (ids.length === 0) {
      this.items.set([]);
      this.state.set('empty');
      return;
    }
    this.state.set('loading');
    try {
      const observables = ids.map((id) => this.getDetail.execute(id));
      const first = await firstValueFrom(observables[0]);
      const rest =
        observables.length === 1
          ? []
          : await firstValueFrom(forkJoin(observables.slice(1)));
      const combined = [first, ...rest];
      const list = combined.map((detail) => ({
        id: detail.id,
        name: detail.name,
        imageUrl: detail.imageUrl,
        types: detail.types,
      }));
      this.items.set(list);
      this.state.set('success');
    } catch {
      this.errorMessage.set('Could not load your favorites.');
      this.state.set('error');
    }
  }
}
