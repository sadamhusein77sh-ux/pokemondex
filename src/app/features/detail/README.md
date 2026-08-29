# Detail Feature

A reusable Ionic modal (`PokemonDetailModalComponent`) that shows everything known about a single Pokémon: hero artwork, type chips, height/weight, abilities, base stats radar, and the full move list.

---

## Purpose

The Detail feature is **not** a routed page — it is a self-contained modal launched from any list or grid (Browse, Favorites, Team). It is responsible for:

- Loading a single Pokémon's detail via `GetPokemonDetailUseCase`.
- Rendering loading / error / success states inside the modal sheet.
- Wrapping the raw `PokemonDetail` DTO in the `PokemonDetailEntity` domain object.
- Letting the user toggle the Pokémon as a favorite from inside the modal.
- Mapping type names to their theme colors (`typeHexColor`, `typeContrastTextClass`).

---

## Files

| File | Responsibility |
|------|----------------|
| `pokemon-detail-modal.module.ts` | Declares + exports `PokemonDetailModalComponent`; imports `SharedModule` and `CommonModule`. |
| `pokemon-detail-modal.component.ts` | Modal component. Loads detail, manages favorite state, exposes color/badge helpers. |
| `pokemon-detail-modal.component.html` | Ionic template using `@switch` for state, hero header with type-tinted gradient, and `<app-pokemon-stats>` for the radar block. |
| `pokemon-detail-modal.component.scss` | Component-scoped styles. |
| `pokemon-detail-modal.component.spec.ts` | Karma + Jasmine tests covering loading, success, error, retry, favorite toggle, image states, and helpers. |

---

## Component API

### Inputs

| Input | Type | Required | Description |
|-------|------|----------|-------------|
| `pokemonId` | `number \| string` | Yes | Identifies which Pokémon to load. Accepts `string` for forward compatibility, but favorites are only synced for numeric IDs. |

### Outputs

None. The modal is dismissed imperatively via `ModalController.dismiss()`.

### Public Signals / Computed

| Signal | Purpose |
|--------|---------|
| `state` | `'loading' \| 'success' \| 'error'`. |
| `detail` | `PokemonDetailEntity \| null` — null until loaded. |
| `errorMessage` | User-facing error text. |
| `isFavorite` | Current favorite status. |
| `favoriteIcon`, `favoriteLabel` | Derived copy/icons for the favorite button. |
| `showImageSkeleton` | `computed` — `true` until either the image loads or errors. |

### Public Methods

| Method | Purpose |
|--------|---------|
| `close()` | Dismisses the modal. |
| `onRetry()` | Re-runs the detail request after an error. |
| `onToggleFavorite()` | Toggles favorite for the loaded Pokémon. |
| `typeColor(type)` | Returns the hex color string for a type. |
| `typeClass(type)` | Returns `bg-type-<name>` for Tailwind type styling. |
| `typeBadgeClass(type)` | Combines background + contrast-text classes. |
| `formatMove(name)` | Title-cases hyphenated move names (`"thunder-punch"` → `"Thunder Punch"`). |
| `formatId(id)` | Pads the numeric ID to three digits (`"001"`). |
| `onImageLoad()`, `onImageError()` | Toggle image skeleton visibility. |

---

## State Machine

```
ngOnInit
   │
   ├─ pokemonId missing?  ──► 'error' ("Missing pokemon id.")
   │
   └─ loadDetail()
        │
        ├─ 'loading'
        ├─ success ─► state='success'  → wrap into PokemonDetailEntity, sync favorite
        └─ error   ─► state='error'    → "Could not load Pokemon details."
```

`onRetry()` re-enters the loading branch without re-creating the modal.

---

## Data Flow

```
componentProps.pokemonId
        │
        ▼
GetPokemonDetailUseCase  ──► PokemonDetail (DTO from PokeAPI)
        │                                │
        │                                ▼
        │                       PokemonDetailEntity (domain)
        │                                │
        │                                ▼
        │                         detail() signal
        │                                │
        │                                ▼
        │                         template @switch 'success'
        │
        └─ IsFavoriteUseCase (snapshots + reactive)
                              │
                              ▼
                       applyFavoriteValue()
```

---

## Type Color Mapping

`typeColor`, `typeClass`, and `typeBadgeClass` delegate to:

- `typeHexColor(type)` — returns a hex string used to build the hero gradient and the avatar halo (`<color>33`, `<color>26`).
- `typeContrastTextClass(type)` — chooses white or near-black text for readable chips.

These helpers live in `src/app/core/utils/type-color.mapper.ts` and are the single source of truth across the app.

---

## Image Loading

The hero image is rendered with:

- `loading="eager"` and `fetchpriority="high"` to prioritize the LCP element.
- A skeleton placeholder (`showImageSkeleton()`) until either the `load` or `error` event fires.
- `decoding="async"` to avoid blocking the main thread.
- A soft drop-shadow for visual depth.

If the image fails, the skeleton stays in place and the underlying `<img>` is hidden so the layout doesn't jump.

---

## Reactive Favorite Sync

Two layers:

1. `IsFavoriteUseCase.execute(id)` emits the current snapshot at subscription time.
2. `ToggleFavoriteUseCase.execute(id)` flips it and the resulting array is observed by the host list (Browse / Favorites) so heart state stays in sync across screens.

The modal never subscribes to a favorites stream directly; it reads the snapshot via `IsFavoriteUseCase.snapshot(id)` after a successful toggle.

---

## Accessibility Notes

- Close button uses an `aria-label="Close detail modal"`.
- The favorite button exposes both an `aria-label` and `aria-pressed` for screen readers.
- Decorative type-colored halos use `aria-hidden="true"`.
- Image alt text is the capitalized Pokémon name + `"official artwork"`.

---

## How to Reuse This Modal

Launch from any page that has access to `ModalController`:

```ts
const modal = await this.modalController.create({
  component: PokemonDetailModalComponent,
  componentProps: { pokemonId: item.id },
  breakpoints: [0, 0.5, 0.95],
  initialBreakpoint: 0.95,
  expandToScroll: true,
});
await modal.present();
```

`PokemonDetailModalModule` is imported by both `BrowsePageModule` and `FavoritesPageModule` and re-exports the component.

---

## How to Modify

- **Add a new section** (e.g. evolutions): create a shared child component in `src/app/shared/components/`, expose the data from `PokemonDetailEntity`, and append a `<section>` block in the `@case ('success')` branch.
- **Change breakpoints**: update the `modalController.create({ breakpoints, initialBreakpoint })` calls in each host page.
- **Theme tweaks**: only edit `type-color.mapper.ts` — every modal instance picks up the change automatically.

---

## Testing

`pokemon-detail-modal.component.spec.ts` covers:

- Loading and error transitions for missing/invalid IDs.
- Success path with full template rendering.
- Favorite toggle and label/icon derivation.
- Image load/error handlers.
- Helper functions (`typeColor`, `typeClass`, `typeBadgeClass`, `formatMove`, `formatId`).
- Modal close behavior.

Run from the project root:

```bash
npm test -- --include=**/features/detail/**
```
