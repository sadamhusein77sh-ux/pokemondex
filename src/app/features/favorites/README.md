# Favorites Feature

The "Favorites" tab. Displays every Pokémon the user has hearted, lets them open the detail modal, and supports removing favorites directly from the list.

---

## Purpose

The Favorites feature:

- Loads the persisted list of favorite Pokémon IDs from `GetFavoritesUseCase`.
- Fetches each Pokémon's full detail (image, types) via `GetPokemonDetailUseCase` to render rich cards.
- Reuses the shared `app-pokemon-card` so the visual treatment matches Browse.
- Opens the same `PokemonDetailModalComponent` used elsewhere in the app.
- Lets the user un-favorite from the grid; the row disappears immediately and the empty state appears if the list becomes empty.
- Falls back to a "Browse Pokemon" CTA when the user has no favorites yet.

---

## Files

| File | Responsibility |
|------|----------------|
| `favorites.module.ts` | Imports `SharedModule`, `PokemonDetailModalModule`, `FavoritesPageRoutingModule`; declares `FavoritesPage`. |
| `favorites-routing.module.ts` | Single lazy route `''` → `FavoritesPage`. |
| `favorites.page.ts` | Smart component orchestrating IDs → details resolution and reactive un-favorite. |
| `favorites.page.html` | `@switch` template with skeleton / error / empty / success states. |
| `favorites.page.scss` | Empty — Tailwind only. |
| `favorites.page.spec.ts` | Karma + Jasmine tests covering subscription, parallel detail loading, error path, un-favorite flow, empty state transitions, and `trackById`. |

---

## Component API

### Inputs / Outputs

None — the page is fully driven by persisted state.

### Internal Model

```ts
interface FavoriteRow {
  readonly id: number;
  readonly name: string;
  readonly imageUrl: string;
  readonly types: ReadonlyArray<{ name: string; url: string }>;
}
```

This is a deliberately small projection of `PokemonDetail` so the template can pass it to the shared `app-pokemon-card` via `$any(item)` (the card accepts the broader `PokemonListItem` shape, which is structurally compatible).

### Public Signals / Computed

| Signal / Computed | Purpose |
|-------------------|---------|
| `state` | `'loading' \| 'success' \| 'empty' \| 'error'`. |
| `items` | The list of resolved `FavoriteRow`s. |
| `favoriteIds` | Raw IDs returned by the favorites repository. |
| `errorMessage` | User-facing error text. |
| `idsKey` | `computed` — a stable, comma-joined string of the IDs (useful for `@if`/change-detection hooks). |

### Public Methods

| Method | Purpose |
|--------|---------|
| `isFavorite(item)` | Returns whether the row's id is in `favoriteIds`. |
| `openDetail(item)` | Presents `PokemonDetailModalComponent` for the given favorite. |
| `onToggleFavorite(item)` | Removes the favorite via `ToggleFavoriteUseCase` and updates the visible list. |
| `onBrowse()` | Hash-jumps to `#/tabs/browse` (the Browse tab). |
| `trackById` | Stable track function for `@for`. |

---

## State Machine

```
ngOnInit
   │
   ▼
GetFavoritesUseCase.execute() ──► ids
   │
   ├─ ids.length === 0?  ─► state = 'empty'           (no fetch)
   │
   └─ fetch all details in parallel
            │
            ├─ success ─► state = 'success'           (items populated)
            └─ error   ─► state = 'error'             (errorMessage set)

Un-favorite (onToggleFavorite)
   │
   ▼
ToggleFavoriteUseCase.execute(id)
   │
   ├─ favoriteIds updated
   ├─ items filtered (row removed)
   └─ if items.length === 0 ─► state = 'empty'
```

---

## Data Flow

```
GetFavoritesUseCase ──► favoriteIds (signal)
                         │
                         ▼
        ids.map(id => GetPokemonDetailUseCase.execute(id))
                         │
                         ▼
       firstValueFrom + forkJoin(remaining)   (see note below)
                         │
                         ▼
               map(detail → FavoriteRow)
                         │
                         ▼
                  items() signal
                         │
                         ▼
                app-pokemon-card grid
                         │
                         ▼
       PokemonDetailModalComponent on tap
```

> Note on parallel loading: the implementation awaits the first detail with `firstValueFrom(observables[0])` and then `forkJoin`s the rest. This is functionally equivalent to `forkJoin(observables)` but allows incremental UI updates if you wire one in later.

---

## Routing

```ts
const routes: Routes = [{ path: '', component: FavoritesPage }];
```

Mounted inside the `tabs` shell at `/tabs/favorites`.

---

## Navigation Between Tabs

`onBrowse()` uses a hash-based navigation to switch tabs while keeping a deep-link-friendly hash:

```ts
window.location.hash = '#/tabs/browse';
```

This keeps the tab switcher experience consistent without requiring a router reference inside the page.

---

## Empty / Error / Loading

| State | UI Element | Notes |
|-------|-----------|-------|
| `loading` | `<app-pokemon-skeleton [count]="6">` | Skeleton mirrors the grid dimensions. |
| `empty` | `<app-empty-state>` | "No favorites yet" with "Browse Pokemon" CTA. |
| `error` | `<app-error-state>` | Generic message, retry sends the user back to Browse. |
| `success` | Responsive card grid (2 → 5 columns). | `trackById` keeps DOM nodes stable across un-favorites. |

---

## Accessibility Notes

- Grid container has `role="list"` semantics through `@for` over `<app-pokemon-card>` cards, which expose interactive controls.
- Decorative heart icon in the toolbar uses standard icon color (no aria-label needed — context is provided by `<ion-title>`).
- Empty-state CTA is a real `<button>` with visible focus ring.

---

## Shared Dependencies

- **Use cases**: `GetFavoritesUseCase`, `ToggleFavoriteUseCase`, `GetPokemonDetailUseCase`.
- **Components**: `app-pokemon-card`, `app-pokemon-skeleton`, `app-error-state`, `app-empty-state`, `PokemonDetailModalComponent`.
- **Ionic**: `ModalController` (lazy).

---

## How to Modify

- **Sort favorites**: sort `items()` after the parallel fetch using a new `computed` (e.g. by id, name, or recency if you persist a timestamp).
- **Persist removal animations**: use Angular Animations or Ionic's leave animations on `app-pokemon-card` when the row is filtered out.
- **Add search**: add an `ion-searchbar` in the toolbar, gate it with a `searchTerm` signal, and update a `filteredItems` computed before passing to the template.

---

## Testing

`favorites.page.spec.ts` covers:

- Subscription to `GetFavoritesUseCase` triggers detail loading.
- Parallel detail resolution (first + `forkJoin(rest)`).
- Error path populates `errorMessage` and sets `state` to `'error'`.
- Un-favorite removes the row from `items()`.
- Empty state appears when the last favorite is removed.
- `trackById` returns the Pokémon's id.

Run from the project root:

```bash
npm test -- --include=**/features/favorites/**
```
