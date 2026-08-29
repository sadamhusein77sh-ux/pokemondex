import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom, skip, Subject, takeUntil } from 'rxjs';

import { ModalController, ToastController } from '@ionic/angular/lazy';

import { PokemonListItem } from '../../core/models/pokemon-list.model';
import {
  isPokemonTypeName,
  PokemonTypeName,
} from '../../core/models/pokemon-type.model';
import {
  GetPokemonByTypeUseCase,
  GetPokemonListUseCase,
} from '../../application/pokemon/pokemon.usecases';
import {
  GetFavoritesUseCase,
  ToggleFavoriteUseCase,
} from '../../application/favorites/favorites.usecases';
import {
  GetSortModeUseCase,
  GetTypeFilterUseCase,
  SetSortModeUseCase,
  SetTypeFilterUseCase,
} from '../../application/preferences/browse-preferences.usecases';
import { SortMode } from '../../domain/repositories/browse-preferences.repository';
import { PokemonDetailModalComponent } from '../detail/pokemon-detail-modal.component';

const PAGE_SIZE = 20;
const INITIAL_SKELETON_COUNT = 8;

@Component({
  selector: 'app-browse-page',
  templateUrl: './browse.page.html',
  styleUrls: ['./browse.page.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BrowsePage implements OnInit, OnDestroy {
  private readonly getList = inject(GetPokemonListUseCase);
  private readonly getByType = inject(GetPokemonByTypeUseCase);
  private readonly getFavorites = inject(GetFavoritesUseCase);
  private readonly toggleFavorite = inject(ToggleFavoriteUseCase);
  private readonly getTypeFilter = inject(GetTypeFilterUseCase);
  private readonly setTypeFilter = inject(SetTypeFilterUseCase);
  private readonly getSortMode = inject(GetSortModeUseCase);
  private readonly setSortMode = inject(SetSortModeUseCase);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly modalController = inject(ModalController);
  private readonly toastController = inject(ToastController);
  private readonly cdr = inject(ChangeDetectorRef);

  @ViewChild('loadSentinel')
  set sentinel(el: ElementRef<HTMLElement> | undefined) {
    this.setupObserver(el?.nativeElement ?? null);
  }

  readonly state = signal<'loading' | 'success' | 'error' | 'empty'>('loading');
  readonly items = signal<ReadonlyArray<PokemonListItem>>([]);
  readonly favoriteIds = signal<ReadonlyArray<number>>([]);
  readonly offset = signal<number>(0);
  readonly isFetchingMore = signal<boolean>(false);
  readonly hasMore = signal<boolean>(true);
  readonly activeType = signal<PokemonTypeName | null>(null);
  readonly sortMode = signal<SortMode>('id');
  readonly skeletonCount = signal<number>(INITIAL_SKELETON_COUNT);

  readonly sortedItems = computed<ReadonlyArray<PokemonListItem>>(() => {
    const list = this.items();
    const mode = this.sortMode();
    const copy = [...list];
    if (mode === 'name') {
      return copy.sort((a, b) => a.name.localeCompare(b.name));
    }
    return copy.sort((a, b) => a.id - b.id);
  });

  private observer: IntersectionObserver | null = null;
  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
    const initialFromUrl = this.parseTypeParam(
      this.route.snapshot.queryParamMap.get('type'),
    );
    if (initialFromUrl !== null) {
      this.activeType.set(initialFromUrl);
      this.setTypeFilter
        .execute(initialFromUrl)
        .pipe(takeUntil(this.destroy$))
        .subscribe();
    }
    void this.refresh();

    this.getTypeFilter
      .execute()
      .pipe(takeUntil(this.destroy$))
      .subscribe((type) => {
        if (type === this.activeType()) {
          return;
        }
        this.activeType.set(type);
        void this.refresh();
      });

    this.getSortMode
      .execute()
      .pipe(takeUntil(this.destroy$))
      .subscribe((mode) => this.sortMode.set(mode));

    this.route.queryParamMap
      .pipe(skip(1), takeUntil(this.destroy$))
      .subscribe((params) => {
        const urlType = this.parseTypeParam(params.get('type'));
        if (urlType === this.activeType()) {
          return;
        }
        this.activeType.set(urlType);
        this.setTypeFilter
          .execute(urlType)
          .pipe(takeUntil(this.destroy$))
          .subscribe();
        void this.refresh();
      });

    this.getFavorites
      .execute()
      .pipe(takeUntil(this.destroy$))
      .subscribe((ids) => this.favoriteIds.set(ids));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.observer?.disconnect();
    this.observer = null;
  }

  isFavorite(item: PokemonListItem): boolean {
    return this.favoriteIds().includes(item.id);
  }

  async openDetail(item: PokemonListItem): Promise<void> {
    const modal = await this.modalController.create({
      component: PokemonDetailModalComponent,
      componentProps: { pokemonId: item.id },
      breakpoints: [0, 0.5, 0.95],
      initialBreakpoint: 0.95,
      expandToScroll: true,
    });
    await modal.present();
  }

  onToggleFavorite(item: PokemonListItem): void {
    const wasFavorite = this.isFavorite(item);
    this.toggleFavorite.execute(item.id).subscribe((next) => {
      this.favoriteIds.set(next);
      void this.showToast(
        wasFavorite ? 'Removed from favorites' : 'Added to favorites',
      );
    });
  }

  onSelectType(type: PokemonTypeName | null): void {
    if (type === this.activeType()) {
      return;
    }
    this.activeType.set(type);
    this.setTypeFilter
      .execute(type)
      .pipe(takeUntil(this.destroy$))
      .subscribe();
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { type: type ?? null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
    this.scrollToTop();
    void this.refresh();
  }

  toggleSortMode(): void {
    const next: SortMode = this.sortMode() === 'id' ? 'name' : 'id';
    this.sortMode.set(next);
    this.setSortMode
      .execute(next)
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  async onRefresh(event: { target: { complete: () => void } }): Promise<void> {
    await this.refresh();
    event.target.complete();
  }

  onRetry(): void {
    void this.refresh();
  }

  trackById = (_: number, item: PokemonListItem): number => item.id;

  private async refresh(): Promise<void> {
    this.observer?.disconnect();
    this.observer = null;
    this.state.set('loading');
    this.skeletonCount.set(INITIAL_SKELETON_COUNT);
    this.offset.set(0);
    this.items.set([]);
    this.hasMore.set(true);
    try {
      const type = this.activeType();
      if (type !== null) {
        await this.loadType(type);
      } else {
        await this.loadFirstPage();
      }
    } catch {
      this.state.set('error');
    }
  }

  private async loadFirstPage(): Promise<void> {
    const page = await firstValueFrom(
      this.getList.execute({ limit: PAGE_SIZE, offset: 0 }),
    );
    this.applyPage(page.results);
    this.hasMore.set(page.nextOffset !== null);
    this.offset.set(page.nextOffset ?? this.offset() + page.results.length);
    this.finalizeState(page.results.length);
  }

  private async loadType(type: PokemonTypeName): Promise<void> {
    const page = await firstValueFrom(this.getByType.execute(type));
    this.applyPage(page.results);
    this.hasMore.set(false);
    this.finalizeState(page.results.length);
  }

  private async loadNextPage(): Promise<void> {
    if (this.isFetchingMore() || !this.hasMore()) {
      return;
    }
    this.isFetchingMore.set(true);
    this.cdr.markForCheck();
    try {
      const nextOffset = this.offset();
      const page = await firstValueFrom(
        this.getList.execute({ limit: PAGE_SIZE, offset: nextOffset }),
      );
      this.applyPage([...this.items(), ...page.results]);
      this.hasMore.set(page.nextOffset !== null);
      this.offset.set(page.nextOffset ?? nextOffset + page.results.length);
    } catch {
      void this.showToast('Could not load more Pokemon.');
    } finally {
      this.isFetchingMore.set(false);
      this.cdr.markForCheck();
    }
  }

  private applyPage(items: ReadonlyArray<PokemonListItem>): void {
    this.items.set(items);
  }

  private finalizeState(count: number): void {
    this.state.set(count === 0 ? 'empty' : 'success');
  }

  private async showToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 1500,
      position: 'bottom',
    });
    await toast.present();
  }

  private parseTypeParam(value: string | null): PokemonTypeName | null {
    if (value === null || value === '') {
      return null;
    }
    return isPokemonTypeName(value) ? value : null;
  }

  private scrollToTop(): void {
    requestAnimationFrame(() => {
      const ionContent = document.querySelector('ion-content.browse-scroll');
      const scrollEl =
        ionContent?.shadowRoot?.querySelector<HTMLElement>('[part="scroll"]');
      scrollEl?.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  private setupObserver(target: HTMLElement | null): void {
    this.observer?.disconnect();
    if (!target) {
      return;
    }
    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            void this.loadNextPage();
            return;
          }
        }
      },
      { rootMargin: '400px 0px' },
    );
    this.observer.observe(target);
  }
}