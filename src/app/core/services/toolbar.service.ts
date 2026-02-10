import { Injectable, Signal, signal } from '@angular/core';

export interface ToolbarAction {
  id: string;
  icon: string;            // PrimeIcons class, e.g. 'pi-download'
  label: string;           // Visible on desktop, hidden on mobile
  callback: () => void;
  active?: Signal<boolean>;
  disabled?: Signal<boolean>;
  loading?: Signal<boolean>;
}

@Injectable({ providedIn: 'root' })
export class ToolbarService {
  /** Current page-level actions shown in the AppShell top bar */
  readonly actions = signal<ToolbarAction[]>([]);

  /** Optional page title override (shown on mobile) */
  readonly pageTitle = signal('');

  setActions(actions: ToolbarAction[]): void {
    this.actions.set(actions);
  }

  setPageTitle(title: string): void {
    this.pageTitle.set(title);
  }

  clear(): void {
    this.actions.set([]);
    this.pageTitle.set('');
  }
}
