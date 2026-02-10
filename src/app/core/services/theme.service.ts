import { Injectable, signal, effect, computed } from '@angular/core';

export type ThemeMode = 'light' | 'dark' | 'system';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly STORAGE_KEY = 'ecom-theme';

  /** User's explicit preference (light | dark | system) */
  readonly mode = signal<ThemeMode>(this.loadSaved());

  /** Resolved effective theme after evaluating 'system' */
  readonly effective = computed<'light' | 'dark'>(() => {
    const m = this.mode();
    if (m === 'system') return this.systemPrefersDark() ? 'dark' : 'light';
    return m;
  });

  /** Whether the OS prefers dark */
  private readonly systemPrefersDark = signal(
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false
  );

  constructor() {
    // Listen to OS theme changes
    if (typeof window !== 'undefined') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      mq.addEventListener('change', (e) => this.systemPrefersDark.set(e.matches));
    }

    // Apply data-theme attribute whenever effective theme changes
    effect(() => {
      const theme = this.effective();
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', theme);
        // Update meta theme-color for mobile browsers
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) {
          meta.setAttribute('content', theme === 'dark' ? '#0d1117' : '#ffffff');
        }
      }
    });
  }

  setTheme(mode: ThemeMode): void {
    this.mode.set(mode);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, mode);
    }
  }

  toggle(): void {
    const current = this.effective();
    this.setTheme(current === 'dark' ? 'light' : 'dark');
  }

  private loadSaved(): ThemeMode {
    if (typeof localStorage === 'undefined') return 'light';
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
    return 'light';
  }
}
