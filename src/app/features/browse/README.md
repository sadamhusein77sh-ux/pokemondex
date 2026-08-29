# Browse Feature

The main "catalog" screen of Pokedex Mobile. Lists Pokémon, supports type filtering, sort modes, infinite scroll, pull-to-refresh, opening the detail modal, and toggling favorites.

---

## Purpose

The Browse feature is the entry point for discovering Pokémon. It:

- Paginates the global Pokémon list (`limit=20` per page).
- Filters by a single `PokemonTypeName` (e.g. `fire`, `water`).
- Sorts in-memory by `id` or `name`.
- Persists the type filter and sort mode via the Browse Preferences repository.
- Surfaces loading / empty / error / success states.
- Streams the current favorite IDs so cards reflect the heart state in real time.
- Opens the shared `PokemonDetailModalComponent` when a card is tapped.

---

## Files

| File | Responsibility |
|------|----------------|
| `browse.module.ts` | Imports `SharedModule`, `PokemonDetailModalModule`, and `BrowsePageRoutingModule`; declares `BrowsePage`. |
| `browse-routing.module.ts` | Single lazy route `''` → `BrowsePage`. |
| `browse.page.ts` | Smart component using Signals + RxJS for paging, filtering, sorting, and observer-based infinite scroll. |
| `browse.page.html` | Ionic template with sticky filter bar, `@switch` state blocks, grid, sentinel element, and `ion-refresher`. |
| `browse.page.scss` | Component-scoped styles (empty — Tailwind utilities only). |
| `browse.page.spec.ts` | Extensive Karma + Jasmine suite covering paging, filters, sort, favorites, scroll, refresh, and error states. |

---

## Component API

### Inputs

None — the component reads the initial type filter from the URL query string (`?type=fire`).

### Outputs (events)

| Method | Triggered By | Effect |
|--------|--------------|--------|
| `openDetail(item)` | Card tap | Opens `PokemonDetailModalComponent` with the selected Pokémon. |
| `onToggleFavorite(item)` | Heart icon tap | Toggles favorite state, shows an Ionic toast. |
| `onSelectType(type)` | Type filter change | Updates URL, persists filter, refreshes list. |
| `toggleSortMode()` | Sort button | Cycles `id` ↔ `name`, persists the selection. |
| `onRefresh($event)` | Pull-to-refresh | Reloads first page, completes refresher. |
| `onRetry()` | Error state's retry button | Reloads after an API failure. |

### Public Signals / Computed

| Signal / Computed | Purpose |
|-------------------|---------|
| `state` | `'loading' \| 'success' \| 'error' \| 'empty'`. |
| `items` | Current page of `PokemonListItem`. |
| `favoriteIds` | Reactive list of favorite Pokémon IDs. |
| `offset` | Next offset for pagination. |
| `isFetchingMore`, `hasMore`, `skeletonCount` | UX state for the infinite-scroll sentinel. |
| `activeType` | Active type filter (`PokemonTypeName \| null`). |
| `sortMode` | `'id' \| 'name'`. |
| `sortedItems` | Computed — `items` reordered according to `sortMode`. |

### ViewChild

`#loadSentinel` — set via a setter that wires an `IntersectionObserver` (rootMargin `'400px 0px'`) to trigger `loadNextPage()` when the sentinel scrolls into view.

---

## State Machine

```
                   ┌──────────► 'empty' ◄── (filtered list = [])
                   │
'loading' ────────►│
                   │
                   ├──────────► 'success' ─► (loadNextPage appends)
                   │
                   └──────────► 'error'  ─► (retry → 'loading')
```

`refresh()` always resets `state` to `'loading'` and reconnects the observer. Pagination never changes the state value — it only mutates `items` and `offset`.

---

## Data Flow

```
URL ?type=  ──┐
              ├─► parseTypeParam ─► activeType signal
Query params  │
Watched via   │
queryParamMap │
              ▼
   GetPokemonListUseCase ───┐
   GetPokemonByTypeUseCase  ├─► applyPage() ─► state = success | empty
   GetFavoritesUseCase       │
   GetSortModeUseCase        │
   GetTypeFilterUseCase      │
                             ▼
                    ModalController / ToastController
                             ▼
                   PokemonDetailModalComponent
```

The page uses the `takeUntil(destroy$)` pattern to avoid leaks. All RxJS streams are torn down in `ngOnDestroy()`.

---

## URL Sync

- `?type=<PokemonTypeName>` mirrors `activeType()`. Changes are pushed via `router.navigate({ queryParams: { type }, replaceUrl: true })` to keep the back stack clean.
- The component also subscribes to `route.queryParamMap` (skipping the first emission) to react to external navigation.

---

## Infinite Scroll

An `IntersectionObserver` is attached to the `#loadSentinel` element with a `400px` pre-fetch margin. While a type filter is active, pagination is disabled because `GetPokemonByTypeUseCase` returns the complete set in a single call. The end of the list is shown via a `'You've reached the end.'` block once `hasMore()` flips to `false`.

---

## Preferences Persistence

`SortMode` and the active type filter are persisted through the Browse Preferences use cases:

```ts
SetTypeFilterUseCase   → BrowsePreferencesRepository (storage)
SetSortModeUseCase     → BrowsePreferencesRepository (storage)
GetTypeFilterUseCase   → emits the persisted type
GetSortModeUseCase     → emits the persisted mode
```

Storage is provided by `IonicStorageService` in `src/app/infrastructure/storage/`.

---

## Routing

```ts
const routes: Routes = [{ path: '', component: BrowsePage }];
```

The feature is mounted inside the `tabs` shell at `/tabs/browse`.

---

## Shared Dependencies

- **Shared module**: `app-pokemon-type-select`, `app-pokemon-skeleton`, `app-pokemon-card`, `app-error-state`, `app-empty-state`.
- **Detail module**: `PokemonDetailModalComponent`.
- **Use cases**: `GetPokemonListUseCase`, `GetPokemonByTypeUseCase`, `GetFavoritesUseCase`, `ToggleFavoriteUseCase`, plus the four Browse Preferences use cases.
- **Models**: `PokemonListItem`, `PokemonTypeName` (with `isPokemonTypeName` guard).
- **Ionic**: `ModalController`, `ToastController` from `@ionic/angular/lazy`.

---

## Accessibility Notes

- All interactive elements are real `<button>`s with `type="button"`.
- Decorative icons carry `aria-hidden="true"`.
- The sort toggle text changes dynamically (`Sort: id` / `Sort: name`).
- The end-of-list block is announced through visible text; the spinner during pagination has no explicit aria-label today (potential improvement).

---

## How to Modify

- **Add a new filter** (e.g. generation): extend `BrowsePreferencesRepository`, add new signals here, and bind to a new component in `app-pokemon-type-select` or a sibling shared component.
- **Change page size**: update `PAGE_SIZE`. Note that PokeAPI caps at known limits — values >100 may need adaptation.
- **Switch to virtualization**: replace the `IntersectionObserver` + grid with `@angular/cdk/scrolling`'s `cdk-virtual-scroll-viewport` and feed it `sortedItems()`.

---

## Testing

`browse.page.spec.ts` is the largest unit test file in the project. It covers:

- Initial loading and skeleton rendering.
- URL-driven type filter bootstrapping.
- Paging via the intersection observer.
- Type filter persistence and reactive refresh.
- Sort mode toggle and persistence.
- Favorite toggling + toast feedback.
- Pull-to-refresh and error retry paths.
- Empty-state messaging for both "no type results" and "no global results".

Run from the project root:

```bash
npm test -- --include=**/features/browse/**
```
