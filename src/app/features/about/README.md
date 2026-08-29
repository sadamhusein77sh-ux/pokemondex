# About Feature

A static, read-only "About" screen that surfaces app metadata, third-party data attribution, and the technology stack used to build Pokedex Mobile.

---

## Purpose

The About feature provides users with a single informational page describing:

- The product (Pokedex Mobile).
- The current shipping version.
- Credits and licensing attribution for the underlying data (PokeAPI).
- The libraries and architectural patterns that compose the app.

The page has **no state, no data fetching, and no side effects** — it is intentionally the simplest feature in the application.

---

## Files

| File | Responsibility |
|------|----------------|
| `about.module.ts` | NgModule wiring — declares `AboutPage` and imports `SharedModule` + `AboutPageRoutingModule`. |
| `about-routing.module.ts` | Lazy-loaded route config that maps `''` to `AboutPage`. |
| `about.page.ts` | The Angular component (ChangeDetection: `OnPush`). Holds three readonly display strings. |
| `about.page.html` | Ionic template using `ion-header`, `ion-content` and Tailwind utility classes. |
| `about.page.scss` | Component-scoped styles (currently empty — styling lives in Tailwind classes). |
| `about.page.spec.ts` | Karma + Jasmine tests verifying rendered text and attribution copy. |

---

## Component API

`AboutPage` exposes only static, immutable properties used by the template:

```ts
readonly apiAttribution = 'Data provided by PokeAPI (https://pokeapi.co/).';
readonly imageAttribution =
  'Official artwork sprites courtesy of the PokeAPI sprites repository.';
readonly appVersion = '1.0.0';
```

There are no `@Input()` or `@Output()` bindings, no lifecycle methods, and no RxJS subscriptions.

---

## Routing

The route is registered in `about-routing.module.ts`:

```ts
const routes: Routes = [{ path: '', component: AboutPage }];
```

The feature is mounted inside the `tabs` shell at the `/tabs/about` path (see `src/app/tabs/tabs-routing.module.ts`).

---

## Conventions Followed

- **ChangeDetection**: `OnPush` (consistent with every other feature page).
- **Standalone**: `false` — declared in a feature `NgModule` like the rest of the app.
- **Styling**: Tailwind utility classes only; no component-level SCSS rules.
- **Accessibility**: Decorative elements (`aria-hidden="true"`) on the `PK` logo and eyebrow labels; semantic `<section>` blocks.
- **No logic**: No service injection, no observables, no async pipe.

---

## How to Modify

1. Update the static strings in `about.page.ts` to change copy or the displayed version.
2. To add a new section, append a `<section>` block to `about.page.html` following the existing rounded-card pattern (`rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5`).
3. If you add an interactive element, follow the focus-ring + transition pattern used by other features (`focus:outline-none focus:ring-2 focus:ring-blue-400`).
4. Add or update tests in `about.page.spec.ts` to cover any new rendered content.

---

## Testing

`about.page.spec.ts` covers:

- App name and version are rendered.
- PokeAPI is credited in the template and on the component instance.

Run from the project root:

```bash
npm test -- --include=**/features/about/**
```
