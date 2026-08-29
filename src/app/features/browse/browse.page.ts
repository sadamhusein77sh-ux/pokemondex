import {
  AfterViewInit,
  ChangeDetectionStrategy,
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
const WINDOW_BUFFER_ROWS = 4;
const MIN_MEASURED_ROW_HEIGHT = 80;

@Component({
  selector: 'app-browse-page',
  templateUrl: './browse.page.html',
  styleUrls: ['./browse.page.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BrowsePage implements OnInit, AfterViewInit, OnDestroy {
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

  @ViewChild('loadSentinel')
  set sentinel(el: ElementRef<HTMLElement> | undefined) {
    this.setupObserver(el?.nativeElement ?? null);
  }

  @ViewChild('grid')
  set gridRef(el: ElementRef<HTMLElement> | undefined) {
    this.grid = el?.nativeElement ?? null;
    if (this.grid) {
      this.attachGridResizeObserver();
      this.attachScrollListener();
      requestAnimationFrame(() => this.measureGrid());
    } else {
      this.teardownGridListeners();
    }
  }

  readonly state = signal<'loading' | 'success' | 'error' | 'empty'>('loading');
  readonly items = signal<ReadonlyArray<PokemonListItem>>([]);
  readonly favoriteIds = signal<ReadonlySet<number>>(new Set());
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

  private readonly scrollTop = signal<number>(0);
  private readonly viewportHeight = signal<number>(0);
  private readonly measuredRowHeight = signal<number>(0);
  private readonly measuredColumns = signal<number>(2);

  readonly totalRows = computed<number>(() => {
    const cols = this.measuredColumns();
    return cols === 0 ? 0 : Math.ceil(this.sortedItems().length / cols);
  });

  readonly visibleRange = computed<{ start: number; end: number }>(() => {
    const items = this.sortedItems();
    const total = items.length;
    if (total === 0) {
      return { start: 0, end: 0 };
    }
    const rh = this.measuredRowHeight();
    if (rh < MIN_MEASURED_ROW_HEIGHT) {
      return { start: 0, end: total };
    }
    const cols = this.measuredColumns();
    const totalRows = Math.ceil(total / cols);
    const top = this.scrollTop();
    const vp = this.viewportHeight();
    const firstRow = Math.max(0, Math.floor(top / rh) - WINDOW_BUFFER_ROWS);
    const lastRow = Math.min(
      totalRows,
      Math.ceil((top + vp) / rh) + WINDOW_BUFFER_ROWS,
    );
    return {
      start: firstRow * cols,
      end: Math.min(total, lastRow * cols),
    };
  });

  readonly visibleItems = computed<ReadonlyArray<PokemonListItem>>(() => {
    const items = this.sortedItems();
    const range = this.visibleRange();
    return items.slice(range.start, range.end);
  });

  readonly topPad = computed<number>(() => {
    const range = this.visibleRange();
    const cols = this.measuredColumns();
    if (cols === 0) {
      return 0;
    }
    return (range.start / cols) * this.measuredRowHeight();
  });

  readonly bottomPad = computed<number>(() => {
    const items = this.sortedItems();
    const range = this.visibleRange();
    const cols = this.measuredColumns();
    if (cols === 0) {
      return 0;
    }
    return ((items.length - range.end) / cols) * this.measuredRowHeight();
  });

  private observer: IntersectionObserver | null = null;
  private grid: HTMLElement | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private scrollEl: HTMLElement | null = null;
  private rafHandle: number | null = null;
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
      .subscribe((ids) => this.favoriteIds.set(new Set(ids)));
  }

  ngAfterViewInit(): void {
    if (this.grid) {
      this.attachGridResizeObserver();
      this.attachScrollListener();
      requestAnimationFrame(() => this.measureGrid());
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.observer?.disconnect();
    this.observer = null;
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    if (this.scrollEl) {
      this.scrollEl.removeEventListener('scroll', this.onScroll);
      this.scrollEl = null;
    }
    if (this.rafHandle !== null) {
      cancelAnimationFrame(this.rafHandle);
      this.rafHandle = null;
    }
  }

  isFavorite(item: PokemonListItem): boolean {
    return this.favoriteIds().has(item.id);
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
      this.favoriteIds.set(new Set(next));
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

  private attachGridResizeObserver(): void {
    if (!this.grid || typeof ResizeObserver === 'undefined') {
      return;
    }
    this.resizeObserver?.disconnect();
    this.resizeObserver = new ResizeObserver(() => this.measureGrid());
    this.resizeObserver.observe(this.grid);
  }

  private teardownGridListeners(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
  }

  private attachScrollListener(): void {
    if (typeof window === 'undefined') {
      return;
    }
    requestAnimationFrame(() => {
      const ionContent = document.querySelector('ion-content.browse-scroll');
      const scrollEl =
        ionContent?.shadowRoot?.querySelector<HTMLElement>('[part="scroll"]') ??
        null;
      if (!scrollEl || scrollEl === this.scrollEl) {
        return;
      }
      this.scrollEl?.removeEventListener('scroll', this.onScroll);
      this.scrollEl = scrollEl;
      this.scrollEl.addEventListener('scroll', this.onScroll, { passive: true });
      this.viewportHeight.set(this.scrollEl.clientHeight);
      this.measureGrid();
    });
  }

  private readonly onScroll = (): void => {
    if (this.rafHandle !== null) {
      return;
    }
    this.rafHandle = requestAnimationFrame(() => {
      this.rafHandle = null;
      const el = this.scrollEl;
      if (el) {
        this.scrollTop.set(el.scrollTop);
        if (el.clientHeight !== this.viewportHeight()) {
          this.viewportHeight.set(el.clientHeight);
        }
      }
    });
  };

  private measureGrid(): void {
    const grid = this.grid;
    if (!grid) {
      return;
    }
    const style = window.getComputedStyle(grid);
    const cols = style.gridTemplateColumns
      .split(' ')
      .filter((s) => s.length > 0).length;
    if (cols > 0 && cols !== this.measuredColumns()) {
      this.measuredColumns.set(cols);
    }
    const firstCard = grid.querySelector('app-pokemon-card');
    if (firstCard) {
      const h = firstCard.getBoundingClientRect().height;
      if (h >= MIN_MEASURED_ROW_HEIGHT && Math.abs(h - this.measuredRowHeight()) > 0.5) {
        this.measuredRowHeight.set(h);
      }
    }
  }
}