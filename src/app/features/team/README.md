# Team Feature

The "Team Builder" tab. Lets the user assemble a 6-slot Pokémon team, swap or remove members, and visualize the team's stat totals and defensive type coverage.

---

## Purpose

The Team feature is the most domain-rich feature in the app. It:

- Persists a list of up to 6 `TeamSlot`s (`{ index, pokemonId }`) via `TeamRepository`.
- Resolves each occupied slot into a full `PokemonDetail` so the UI can render types, abilities, and stats.
- Surfaces derived analytics computed reactively via Signals:
  - **Stat totals** rendered in a radar chart (`app-stats-radar-chart`).
  - **Defensive type coverage** rendered in `app-type-coverage-panel`.
  - **Headline averages** (Avg HP / Avg Atk) shown under the radar.
- Provides a picker modal (`team-picker-modal/`) for adding or swapping members.
- Presents an action sheet (`ActionSheetController`) when the user taps an occupied slot.

---

## Files

| File | Responsibility |
|------|----------------|
| `team.module.ts` | Imports `SharedModule`, `TeamPickerModalModule`, `TeamPageRoutingModule`; declares `TeamPage`. |
| `team-routing.module.ts` | Single lazy route `''` → `TeamPage`. |
| `team.page.ts` | Smart component — orchestrates slots, details, coverage, stats, modals, and action sheets. |
| `team.page.html` | `@switch` template with loading / empty / success states; sections for progress, radar, slots, coverage. |
| `team.page.scss` | Empty — Tailwind only. |
| `team.page.spec.ts` | Karma + Jasmine tests covering load, add, swap, remove, clear, empty state, and stat/coverage computations. |
| `team-picker-modal/team-picker-modal.module.ts` | Module declaration for the picker modal. |
| `team-picker-modal/team-picker-modal.component.ts` | Modal component — paginated Pokémon list, type filter, debounced search. |
| `team-picker-modal/team-picker-modal.component.html` | Modal template (toolbar + search + filter + scrollable list). |
| `team-picker-modal/team-picker-modal.component.scss` | Modal-scoped styles. |
| `team-picker-modal/team-picker-modal.component.spec.ts` | Karma + Jasmine tests covering pagination, search, filter, exclusions, and selection. |

---

## Team Page Component

### Inputs / Outputs

None — fully driven by the persisted team and the use cases.

### Internal Model

```ts
interface ResolvedSlot {
  readonly slot: TeamSlot;                          // { index, pokemonId }
  readonly pokemon: TeamSlotPokemon | null;         // shape consumed by app-team-slot
  readonly detail: PokemonDetail | null;            // full detail for stats/coverage
  readonly loading: boolean;                        // true while detail is being fetched
}
```

`TEAM_MAX_SIZE` is `6` and is imported from `core/models/team.model`.

### Public Signals / Computed

| Signal / Computed | Purpose |
|-------------------|---------|
| `state` | `'loading' \| 'success' \| 'empty' \| 'error'`. |
| `slots` | Raw `TeamSlot[]` from the repository. |
| `details` | `Record<number, PokemonDetail>` keyed by Pokémon id. |
| `errorMessage` | User-facing error text. |
| `filledSlots` | `computed` — sorted copy of `slots()` (ascending by index). |
| `hasTeam`, `isFull` | Convenience computeds for UX. |
| `resolvedSlots` | `computed` — always-length-6 array of `ResolvedSlot`, padding with empty slots as needed. |
| `coverage` | `computed<TypeDefensiveCoverage>` — runs `ComputeTeamTypeCoverageUseCase` over member types. |
| `teamStats` | `computed` — runs `ComputeTeamStatsUseCase` over member details. |
| `progressText` | `computed` — `'n/6'` for the progress header. |
| `completionBadge` | `computed` — `'Team Complete!'` when full, otherwise `null`. |
| `radarSize` | `computed` — `220` on `lg+`, otherwise `180`. |

### Public Methods

| Method | Purpose |
|--------|---------|
| `onSlotOpen(index)` | Tapped slot — opens the picker (if empty) or an action sheet (if occupied). |
| `onSlotRemove(index)` | Removes the member via `RemoveFromTeamUseCase`. |
| `onAddPokemon()` | Finds the first empty index and opens the picker. |
| `onClearTeam()` | Calls `ClearTeamUseCase` after the user taps the Clear button. |
| `trackBySlot` | Stable `track` function for `@for`. |
| `formatId(id)` | Pads an id to three digits for the slot header. |

---

## State Machine

```
ngOnInit
   │
   ▼
GetTeamUseCase.execute() ──► slots
   │
   ├─ slots.length === 0 ─► state = 'empty'
   │
   └─ loadDetails(slots) in parallel
         │
         ├─ any failure?  ─► 'error' (only if every fetch failed)
         └─ otherwise     ─► 'success'

Slot tap
   │
   ├─ empty slot ──► openPicker(index, excludeCurrent=false)
   │
   └─ occupied   ──► promptSlotActions(index)
                       │
                       ├─ Swap   ──► openPicker(index, excludeCurrent=true)
                       ├─ Remove ──► RemoveFromTeamUseCase.execute
                       └─ Cancel
```

---

## Data Flow

```
GetTeamUseCase ──► slots()
                    │
                    ├─► loadDetails(slots)  ──► GetPokemonDetailUseCase (parallel)
                    │                              │
                    │                              ▼
                    │                       details() signal
                    │
                    └─► resolvedSlots() (computed) ──► app-team-slot grid
                              │
                              ├──► ComputeTeamTypeCoverageUseCase ──► coverage()
                              └──► ComputeTeamStatsUseCase          ──► teamStats()
                                       │
                                       ├──► app-stats-radar-chart
                                       └──► headline averages (Avg HP / Avg Atk)

Picker modal:
   TeamPickerModalComponent ──► modalController.dismiss({ pokemonId })
                                     │
                                     ├─ slot occupied? SwapTeamSlotUseCase.execute
                                     └─ slot empty?    AddToTeamUseCase.execute
```

---

## Type Coverage Computation

`ComputeTeamTypeCoverageUseCase` (in `src/app/application/team/team-coverage.usecases.ts`) consumes a `PokemonTypeName[][]` (each inner array = the types of one team member) and returns a `TypeDefensiveCoverage` built by `core/utils/type-effectiveness.ts`. The result is fed into `app-type-coverage-panel` which renders weakness / resistance summaries.

---

## Stat Totals Computation

`ComputeTeamStatsUseCase` accepts `PokemonDetail[]` and returns a `TeamStats` object with totals for HP, Attack, Defense, Sp. Atk, Sp. Def, and Speed plus an aggregate `total`. The values are bound to the radar chart and to the `Avg HP` / `Avg Atk` cells via the Angular `number` pipe.

---

## Routing

```ts
const routes: Routes = [{ path: '', component: TeamPage }];
```

Mounted inside the `tabs` shell at `/tabs/team`.

---

## Team Picker Modal

`team-picker-modal/` hosts `TeamPickerModalComponent`, a self-contained Ionic modal with:

| Feature | Behavior |
|---------|----------|
| Listing | Paginates the global Pokémon list (`PAGE_SIZE = 20`). |
| Type filter | Calls `GetPokemonByTypeUseCase` and disables pagination (single fetch). |
| Search | Debounced (`SEARCH_DEBOUNCE_MS = 250`) text filter over the currently loaded items. |
| Exclusions | Hidden via `[excludedIds]` input — filled slots are removed from results automatically. |
| Infinite scroll | `onScroll` triggers `loadNextPage()` within `SCROLL_PREFETCH_PX = 400` of the bottom (throttled to 100 ms between fetches). |
| Selection | Dismisses with `{ pokemonId }` payload. |

The host (`TeamPage`) decides whether to call `AddToTeamUseCase` or `SwapTeamSlotUseCase` based on whether the target slot is already occupied.

---

## Action Sheet

When a slot is tapped and the slot is occupied, `promptSlotActions()` shows an Ionic action sheet with **Swap**, **Remove**, and **Cancel** buttons. Swap opens the picker with `excludeCurrent=true`; Remove deletes the member immediately.

---

## Accessibility Notes

- Toolbar buttons have visible focus rings and `aria-label`s where the icon alone would be unclear.
- Section blocks have explicit `aria-label`s (`Team progress`, `Team stat totals`, `Team slots`, `Type coverage`).
- The progress bar is purely decorative (`aria-hidden="true"`) because the textual `progressText` already announces the value.
- Stat averages use `<dl>` / `<dt>` / `<dd>` semantics.

---

## Shared Dependencies

- **Use cases**: `GetTeamUseCase`, `AddToTeamUseCase`, `RemoveFromTeamUseCase`, `SwapTeamSlotUseCase`, `ClearTeamUseCase`, `ComputeTeamStatsUseCase`, `ComputeTeamTypeCoverageUseCase`, `GetPokemonDetailUseCase`.
- **Components**: `app-team-slot`, `app-stats-radar-chart`, `app-type-coverage-panel`, `app-error-state`, plus the picker modal.
- **Models / Utils**: `TeamSlot`, `TEAM_MAX_SIZE`, `PokemonTypeName`, `type-effectiveness`.
- **Ionic**: `ModalController`, `ActionSheetController` (both lazy).

---

## How to Modify

- **Change team size**: update `TEAM_MAX_SIZE` in `core/models/team.model.ts`. Note that downstream consumers (radar, grid columns, progress text) must be reviewed for layout impact.
- **Add a derived analytics panel**: create a new use case under `application/team/`, expose it as a `computed` here, and render it inside the existing `@case ('success')` block.
- **Restrict valid members**: enforce rules (e.g. no duplicate species) inside `AddToTeamUseCase` / `SwapTeamSlotUseCase` — the UI is currently permissive.
- **Persist team naming**: add a `Team` aggregate that wraps the slots with a name and timestamps; surface editing controls in the toolbar.

---

## Testing

`team.page.spec.ts` covers:

- Initial load with no slots → `state = 'empty'`.
- Initial load with slots → `state = 'loading'` then `'success'` after details resolve.
- Add via picker (occupied → `SwapTeamSlotUseCase`).
- Remove via action sheet.
- Clear team via header button.
- Derived stats / coverage computations.
- Picker modal interactions and exclusion filter.

`team-picker-modal.component.spec.ts` covers:

- Initial load with type filter.
- Pagination via scroll handler.
- Debounced search.
- Excluded ids hidden from results.
- Modal dismiss payload.

Run from the project root:

```bash
npm test -- --include=**/features/team/**
```
