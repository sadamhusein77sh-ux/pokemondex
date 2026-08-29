import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnDestroy,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ModalController } from '@ionic/angular/lazy';
import { firstValueFrom, Subject } from 'rxjs';

import {
  GetPokemonByTypeUseCase,
  GetPokemonListUseCase,
} from '../../../application/pokemon/pokemon.usecases';
import { PokemonListItem } from '../../../core/models/pokemon-list.model';
import { PokemonTypeName } from '../../../core/models/pokemon-type.model';
import { typeHexColor } from '../../../core/utils/type-color.mapper';

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 250;
const SCROLL_PREFETCH_PX = 400;

@Component({
  selector: 'app-team-picker-modal',
  templateUrl: './team-picker-modal.component.html',
  styleUrls: ['./team-picker-modal.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamPickerModalComponent implements OnDestroy {
  private readonly excludedIdsSignal = signal<ReadonlyArray<number>>([]);

  @Input()
  set excludedIds(value: ReadonlyArray<number> | null | undefined) {
    this.excludedIdsSignal.set(value ?? []);
  }
  get excludedIds(): ReadonlyArray<number> {
    return this.excludedIdsSignal();
  }

  private readonly modalController = inject(ModalController);
  private readonly getList = inject(GetPokemonListUseCase);
  private readonly getByType = inject(GetPokemonByTypeUseCase);

  readonly state = signal<'loading' | 'success' | 'empty' | 'error'>('loading');
  readonly items = signal<ReadonlyArray<PokemonListItem>>([]);
  readonly activeType = signal<PokemonTypeName | null>(null);
  readonly searchTerm = signal<string>('');
  readonly rawQuery = signal<string>('');
  readonly offset = signal<number>(0);
  readonly hasMore = signal<boolean>(true);
  readonly isFetchingMore = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  private readonly imageLoaded = signal<ReadonlySet<number>>(new Set());
  private readonly imageErrored = signal<ReadonlySet<number>>(new Set());

  isImageLoaded(id: number): boolean {
    return this.imageLoaded().has(id);
  }

  isImageErrored(id: number): boolean {
    return this.imageErrored().has(id);
  }

  showImageSkeleton(id: number): boolean {
    return !this.isImageLoaded(id) && !this.isImageErrored(id);
  }

  readonly filteredItems = computed<ReadonlyArray<PokemonListItem>>(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const excluded = new Set(this.excludedIdsSignal());
    const base = this.items().filter((item) => !excluded.has(item.id));
    if (term.length === 0) {
      return base;
    }
    return base.filter((item) => item.name.toLowerCase().includes(term));
  });

  readonly displayCount = computed(() => this.filteredItems().length);

  readonly totalLoaded = computed(() => this.items().length);

  readonly isSearchActive = computed(() => this.searchTerm().trim().length > 0);

  private debounceHandle: number | null = null;
  private lastPrefetchAt = 0;
  private readonly destroy$ = new Subject<void>();

  ionViewWillEnter(): void {
    if (this.items().length === 0) {
      void this.loadFirstPage();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.debounceHandle !== null) {
      window.clearTimeout(this.debounceHandle);
    }
  }

  async dismiss(): Promise<void> {
    await this.modalController.dismiss();
  }

  onSearch(value: string): void {
    this.rawQuery.set(value);
    if (this.debounceHandle !== null) {
      window.clearTimeout(this.debounceHandle);
    }
    this.debounceHandle = window.setTimeout(() => {
      this.searchTerm.set(this.rawQuery());
    }, SEARCH_DEBOUNCE_MS);
  }

  onSelectType(type: PokemonTypeName | null): void {
    if (type === this.activeType()) {
      return;
    }
    this.activeType.set(type);
    void this.loadFirstPage();
  }

  onRetry(): void {
    void this.loadFirstPage();
  }

  onSelect(item: PokemonListItem): void {
    void this.modalController.dismiss({ pokemonId: item.id });
  }

  onScroll(event: Event): void {
    if (this.state() !== 'success' || !this.hasMore() || this.isFetchingMore()) {
      return;
    }
    if (this.activeType() !== null) {
      return;
    }
    const target = event.currentTarget as HTMLElement | null;
    if (!target) {
      return;
    }
    const scrollTop = target.scrollTop;
    const scrollHeight = target.scrollHeight;
    const clientHeight = target.clientHeight;
    if (scrollHeight <= clientHeight) {
      return;
    }
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    if (distanceFromBottom <= SCROLL_PREFETCH_PX) {
      const now = Date.now();
      if (now - this.lastPrefetchAt < 100) {
        return;
      }
      this.lastPrefetchAt = now;
      void this.loadNextPage();
    }
  }

  trackById = (_: number, item: PokemonListItem): number => item.id;

  typeColor(type: string): string {
    return typeHexColor(type);
  }

  capitalize(value: string): string {
    if (value.length === 0) {
      return value;
    }
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  formatId(id: number): string {
    return id.toString().padStart(3, '0');
  }

  hasAnyType(item: PokemonListItem): boolean {
    return item.types.length > 0;
  }

  onImageLoad(id: number): void {
    const next = new Set(this.imageLoaded());
    next.add(id);
    this.imageLoaded.set(next);
  }

  onImageError(id: number, event: Event): void {
    const failed = new Set(this.imageErrored());
    failed.add(id);
    this.imageErrored.set(failed);
    const img = event.target as HTMLImageElement | null;
    img?.classList.add('opacity-0');
  }

  private async loadFirstPage(): Promise<void> {
    this.state.set('loading');
    this.errorMessage.set(null);
    this.items.set([]);
    this.offset.set(0);
    this.hasMore.set(true);
    this.isFetchingMore.set(false);
    this.lastPrefetchAt = 0;
    try {
      const type = this.activeType();
      if (type !== null) {
        await this.loadType(type);
      } else {
        await this.loadListPage(0);
      }
    } catch {
      this.errorMessage.set('Could not load the Pokémon list.');
      this.state.set('error');
    }
  }

  private async loadNextPage(): Promise<void> {
    if (this.isFetchingMore() || !this.hasMore() || this.activeType() !== null) {
      return;
    }
    this.isFetchingMore.set(true);
    try {
      await this.loadListPage(this.offset());
    } catch {
      this.errorMessage.set('Could not load more Pokémon.');
    } finally {
      this.isFetchingMore.set(false);
    }
  }

  private async loadListPage(offsetValue: number): Promise<void> {
    const page = await firstValueFrom(
      this.getList.execute({ limit: PAGE_SIZE, offset: offsetValue }),
    );
    this.applyPage(page.results);
    this.hasMore.set(page.nextOffset !== null);
    this.offset.set(page.nextOffset ?? offsetValue + page.results.length);
    this.state.set(this.items().length === 0 ? 'empty' : 'success');
  }

  private async loadType(type: PokemonTypeName): Promise<void> {
    const page = await firstValueFrom(this.getByType.execute(type));
    this.applyPage(page.results);
    this.hasMore.set(false);
    this.state.set(page.results.length === 0 ? 'empty' : 'success');
  }

  private applyPage(next: ReadonlyArray<PokemonListItem>): void {
    if (this.state() === 'loading') {
      this.items.set([...next]);
      return;
    }
    this.items.set([...this.items(), ...next]);
  }
}
