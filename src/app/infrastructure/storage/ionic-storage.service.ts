import { Injectable, InjectionToken, inject } from '@angular/core';

export interface KeyValueStorage {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

export const LOCAL_STORAGE_BACKING = new InjectionToken<KeyValueStorage>(
  'LOCAL_STORAGE_BACKING',
  // Swap this provider at the module level to retarget storage:
  //  - Capacitor: wire a `KeyValueStorage` wrapper around
  //    `@capacitor/preferences` (or `@capacitor-community/sqlite`) in
  //    `CoreModule.providers`. The repository layer does not change.
  //  - SSR / server-side rendering: provide a process-memory or noop
  //    implementation so `get()`/`set()`/`remove()` always resolve cleanly.
  //    The current `IonicStorageService` already catches errors, so leaving
  //    the default `resolveBrowserBacking()` (which checks `typeof globalThis`)
  //    is also a safe fallback for non-browser runtimes.
);

const STORAGE_NAMESPACE = 'pokedex-mobile';

@Injectable({ providedIn: 'root' })
export class IonicStorageService implements KeyValueStorage {
  private readonly prefix = `${STORAGE_NAMESPACE}:`;
  private readonly backing: KeyValueStorage =
    inject(LOCAL_STORAGE_BACKING, { optional: true }) ?? this.resolveBrowserBacking();

  async get(key: string): Promise<string | null> {
    try {
      return await this.backing.get(this.scoped(key));
    } catch {
      return null;
    }
  }

  async set(key: string, value: string): Promise<void> {
    try {
      await this.backing.set(this.scoped(key), value);
    } catch {
      /* graceful degradation: storage quota or unavailable */
    }
  }

  async remove(key: string): Promise<void> {
    try {
      await this.backing.remove(this.scoped(key));
    } catch {
      /* graceful degradation */
    }
  }

  private scoped(key: string): string {
    return `${this.prefix}${key}`;
  }

  private resolveBrowserBacking(): KeyValueStorage {
    if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
      const ls = (globalThis as { localStorage?: Storage }).localStorage;
      if (ls !== undefined && typeof ls.getItem === 'function') {
        return {
          get: async (k: string) => ls.getItem(k),
          set: async (k: string, v: string) => {
            ls.setItem(k, v);
          },
          remove: async (k: string) => {
            ls.removeItem(k);
          },
        };
      }
    }
    return {
      get: async () => null,
      set: async () => undefined,
      remove: async () => undefined,
    };
  }
}
