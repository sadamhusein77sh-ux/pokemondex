# Pokémondex

A modern, cross-platform Pokédex built with **Angular 22**, **Ionic 9**, and **Capacitor 8**. Browse every Pokémon, view detailed stats, mark favorites, build balanced teams with type-coverage analysis, and run it all as a native **iOS/Android** app or a **progressive web app**.

> Data is sourced live from the community-maintained [PokeAPI](https://pokeapi.co/) and cached locally for fast, offline-friendly access.

---

## Table of Contents

- [Features](#features)
- [Screenshots](#screenshots)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Mobile Build](#mobile-build)
- [Web Deployment](#web-deployment)
- [Testing & Quality](#testing--quality)
- [Project Structure](#project-structure)
- [Data Attribution](#data-attribution)
- [License](#license)

---

## Features

### Browse
- Paginated grid of all Pokémon with **infinite scroll** powered by an `IntersectionObserver`.
- **Viewport virtual scrolling** — only cards inside the visible viewport (plus a 4-row buffer) are rendered, with spacer pads above/below to preserve scroll geometry. Powered by `ResizeObserver`, a throttled scroll listener, and Angular Signals — keeps a 1k+ list at a flat rendering cost.
- **Type filter** (18 official types) with sticky chip bar and URL-state sync.
- **Sort modes**: by National Dex ID or alphabetical name.
- **Pull-to-refresh**, skeleton loaders, empty/error states.
- Lazy-loaded detail modal with breakpoints for a native feel.

### Favorites
- One-tap heart toggle on any card.
- Persisted locally via Ionic Storage (survives app restarts).
- Badged tab indicator showing the current count.
- Backed by an in-memory `Set` signal for O(1) lookups inside hot paths like the virtualized grid.

### Team Builder
- Build a team of **up to 6 Pokémon**.
- Visual **stat radar chart** summarizing team totals.
- Automatic **type-coverage analysis** — see offensive and defensive matchups at a glance.
- Slot-based UX: add, swap, or remove members from a picker modal.

### Detail Modal
- Official artwork with multi-tier sprite fallbacks (placeholder if all fail).
- Base stats, abilities (including hidden), types, moves list.
- Type-colored badges using a shared color palette.
- Image and skeleton use `absolute inset-0 m-auto` centering so they stay perfectly aligned across breakpoints while the asset loads.

### About
- Static info page describing the app, data source, and attributions.
- Content is constrained to a `max-w-2xl` centered column for readable line lengths on tablets and desktop.

### Cross-Platform
- Runs as a **native iOS/Android** app (Capacitor 8).
- Runs as a **PWA** deployable to any static host (Vercel-ready with SPA rewrites).
- Responsive layout adapts from phones to tablets.

---

## Tech Stack

| Layer            | Technology                                         |
| ---------------- | -------------------------------------------------- |
| Framework        | Angular 22 (NgModule architecture)                 |
| UI Kit           | Ionic 9 (`@ionic/angular`) + `ionicons`            |
| Mobile Runtime   | Capacitor 8 (Android + iOS)                        |
| Styling          | Tailwind CSS 3 + SCSS (Ionic theme variables)      |
| State / Reactivity | Angular **Signals** + RxJS                       |
| HTTP             | Angular `HttpClient` with `provideHttpClient`      |
| Persistence      | `@ionic/storage` (favorites, team, preferences)    |
| Caching          | In-memory **LRU cache** (capacity = 100 entries)   |
| Data Source      | [PokeAPI v2](https://pokeapi.co/)                  |
| Testing          | Vitest + jsdom, Angular `TestBed`                  |
| Linting          | ESLint (flat config) + `angular-eslint`            |
| Build            | `@angular/build:application` (esbuild)              |
| Deployment       | Vercel (`vercel.json` configured)                  |

---

## Architecture

The project follows a **Clean Architecture** inspired layering that keeps UI, application logic, domain models, and infrastructure cleanly separated.

```
src/app
├── core/           # Cross-cutting models, utils, and tokens
│   ├── models/     # Plain TypeScript DTOs / domain types
│   └── utils/      # Pure helpers (id-extractor, type-color, image-url, type-effectiveness, …)
├── domain/         # Enterprise-wide contracts
│   ├── entities/   # Domain entities
│   ├── repositories/ # Repository interfaces
│   └── services/   # Domain service interfaces
├── infrastructure/ # Adapters for external concerns
│   ├── api/        # PokeApiService (HTTP client)
│   ├── cache/      # LRU PokemonCacheService
│   └── storage/    # IonicStorage wrapper
├── application/    # Use cases (one responsibility per file)
│   ├── pokemon/
│   ├── favorites/
│   ├── team/
│   └── preferences/
├── features/       # UI pages (Browse, Favorites, Team, About, Detail)
├── shared/         # Reusable presentational components (cards, skeletons, charts…)
├── tabs/           # Ionic tabs shell (bottom navigation)
├── app.module.ts   # Root NgModule
└── app-routing.module.ts
```

**Key principles**
- Pages depend on **use cases** injected via Angular DI — never on infrastructure directly.
- Use cases orchestrate repositories + services through interfaces, making the system testable with fakes.
- All view models are reactive via **Signals**; OnPush change detection across the board.
- `ChangeDetectorRef` is intentionally avoided — derived state is expressed through `computed`/`signal` so change detection is automatic.

---

## Getting Started

### Prerequisites
- **Node.js** ≥ 20.19 (Angular 22 requirement)
- **npm** ≥ 10
- For mobile builds: Android Studio (API 34+) and/or Xcode 15+

### Install

```bash
npm install
```

### Run in the browser (dev server)

```bash
npm start
```

Navigate to `http://localhost:4200/`. The app reloads automatically on file changes.

### Production build (web)

```bash
npm run build
```

Outputs static assets to `www/` — ready to serve from any static host.

---

## Available Scripts

| Script                | Description                                                       |
| --------------------- | ----------------------------------------------------------------- |
| `npm start`           | Starts Angular dev server with HMR                                |
| `npm run build`       | Production build → `www/`                                         |
| `npm run watch`       | Development build that watches for changes                        |
| `npm test`            | Runs unit tests (Vitest + jsdom + Angular TestBed)                |
| `npm run lint`        | Lints TypeScript and HTML with ESLint                             |
| `npm run build:android` | Production build + `cap sync android` + opens Android Studio    |
| `npm run build:ios`     | Production build + `cap sync ios` + opens Xcode                 |

---

## Mobile Build

The project ships with Capacitor 8 configured for both Android and iOS.

### Android

```bash
npm run build:android
```

This runs `ng build`, syncs the `www/` output into the native `android/` project, and opens Android Studio. From there you can run on an emulator or build a release APK/AAB.

> Required: Android SDK, an Android device or emulator (API 23+), and Java 17+.

### iOS

```bash
npm run build:ios
```

Runs `ng build`, syncs assets into `ios/`, and opens Xcode. Configure signing & capabilities in Xcode, then run on a simulator or device.

> Required: macOS with Xcode 15+, CocoaPods, and an Apple Developer account for device deployment.

For step-by-step instructions, see [`BUILD_MOBILE.md`](./BUILD_MOBILE.md).

---

## Web Deployment

The repo includes a `vercel.json` configured for Angular SPAs:

```json
{
  "framework": "angular",
  "buildCommand": "npm run build",
  "outputDirectory": "www",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

Deploy with:

```bash
vercel --prod
```

The rewrite rule sends all routes to `index.html` so Angular's router handles deep links client-side.

---

## Testing & Quality

- **Unit tests** live next to the code they exercise (`*.spec.ts`).
- The test runner is **Vitest** with a **jsdom** environment (see `src/test-setup.ts`).
- Coverage spans:
  - Pure utilities (`id-extractor`, `image-url.builder`, `stat-name.mapper`, `type-color.mapper`, `type-effectiveness`)
  - Repositories (`team.repository.impl`)
  - Use cases (`team-coverage.usecases`, `team.usecases`)
  - Pages and modal components
- **ESLint** (flat config) enforces Angular style and TypeScript best practices via `angular-eslint` and `typescript-eslint`.

Run tests:

```bash
npm test
```

Run linter:

```bash
npm run lint
```

---

## Project Structure (high level)

```
pokemondex/
├── android/                # Capacitor Android project
├── ios/                    # Capacitor iOS project (generated on `cap add ios`)
├── src/
│   ├── app/                # Angular app code (see Architecture)
│   ├── assets/             # Static assets (icons, images)
│   ├── environments/       # Environment configurations
│   ├── theme/              # Ionic SCSS variables
│   ├── global.scss         # Global styles
│   ├── index.html          # App shell
│   └── main.ts             # Bootstrap entry point
├── www/                    # Production build output (Capacitor webDir)
├── angular.json            # Angular workspace config
├── capacitor.config.ts     # Capacitor configuration
├── ionic.config.json       # Ionic CLI configuration
├── tailwind.config.js      # Tailwind theme (type color tokens)
├── tsconfig*.json          # TypeScript configs
├── vercel.json             # Vercel deployment config
└── package.json
```

---

## Data Attribution

- Pokémon data, sprites, and official artwork are provided by **[PokeAPI](https://pokeapi.co/)** — an open, community-maintained RESTful API.
- Pokémon and Pokémon character names are trademarks of **Nintendo / Game Freak / Creatures Inc.**
- This project is a non-commercial fan-made application for educational and demonstration purposes only.

---

## License

Released under the **MIT License**. See [`LICENSE`](./LICENSE) (if present) for the full text. By using this project you acknowledge the third-party attributions above.