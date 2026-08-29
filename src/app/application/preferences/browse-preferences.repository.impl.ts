import { Injectable, inject } from '@angular/core';
import { Observable, ReplaySubject, of } from 'rxjs';

import {
  BrowsePreferencesRepository,
  SortMode,
} from '../../domain/repositories/browse-preferences.repository';
import {
  isPokemonTypeName,
  PokemonTypeName,
} from '../../core/models/pokemon-type.model';
import { IonicStorageService } from '../../infrastructure/storage/ionic-storage.service';

const TYPE_FILTER_STORAGE_KEY = 'browse:type-filter';
const SORT_MODE_STORAGE_KEY = 'browse:sort-mode';

const VALID_SORT_MODES: readonly SortMode[] = ['id', 'name'];

@Injectable({ providedIn: 'root' })
export class BrowsePreferencesRepositoryImpl implements BrowsePreferencesRepository {
  private readonly storage = inject(IonicStorageService);
  private readonly typeSubject = new ReplaySubject<PokemonTypeName | null>(1);
  private readonly sortModeSubject = new ReplaySubject<SortMode>(1);
  private currentType: PokemonTypeName | null = null;
  private currentSortMode: SortMode = 'id';
  private hydrated = false;

  constructor() {
    if (typeof globalThis !== 'undefined' && 'addEventListener' in globalThis) {
      globalThis.addEventListener('storage', this.handleStorage);
    }
  }

  loadTypeFilter(): Observable<PokemonTypeName | null> {
    void this.ensureHydrated();
    return this.typeSubject.asObservable();
  }

  saveTypeFilter(type: PokemonTypeName | null): Observable<PokemonTypeName | null> {
    this.persistType(type);
    return of(this.currentType);
  }

  loadSortMode(): Observable<SortMode> {
    void this.ensureHydrated();
    return this.sortModeSubject.asObservable();
  }

  saveSortMode(mode: SortMode): Observable<SortMode> {
    this.persistSortMode(mode);
    return of(this.currentSortMode);
  }

  private readonly handleStorage = (event: StorageEvent): void => {
    const key = event.key ?? '';
    if (key.endsWith(`:${TYPE_FILTER_STORAGE_KEY}`)) {
      void this.rehydrateType();
    } else if (key.endsWith(`:${SORT_MODE_STORAGE_KEY}`)) {
      void this.rehydrateSortMode();
    }
  };

  private async ensureHydrated(): Promise<void> {
    if (this.hydrated) {
      return;
    }
    this.hydrated = true;
    await Promise.all([this.rehydrateType(), this.rehydrateSortMode()]);
  }

  private async rehydrateType(): Promise<void> {
    const raw = await this.storage.get(TYPE_FILTER_STORAGE_KEY);
    this.currentType = this.parseType(raw);
    this.typeSubject.next(this.currentType);
  }

  private async rehydrateSortMode(): Promise<void> {
    const raw = await this.storage.get(SORT_MODE_STORAGE_KEY);
    this.currentSortMode = this.parseSortMode(raw);
    this.sortModeSubject.next(this.currentSortMode);
  }

  private persistType(type: PokemonTypeName | null): void {
    this.currentType = type;
    this.typeSubject.next(type);
    if (type === null) {
      void this.storage.remove(TYPE_FILTER_STORAGE_KEY);
    } else {
      void this.storage.set(TYPE_FILTER_STORAGE_KEY, type);
    }
  }

  private persistSortMode(mode: SortMode): void {
    this.currentSortMode = mode;
    this.sortModeSubject.next(mode);
    void this.storage.set(SORT_MODE_STORAGE_KEY, mode);
  }

  private parseType(raw: string | null): PokemonTypeName | null {
    if (raw === null || raw === '') {
      return null;
    }
    return isPokemonTypeName(raw) ? raw : null;
  }

  private parseSortMode(raw: string | null): SortMode {
    if (raw === null) {
      return 'id';
    }
    return VALID_SORT_MODES.includes(raw as SortMode) ? (raw as SortMode) : 'id';
  }
}
