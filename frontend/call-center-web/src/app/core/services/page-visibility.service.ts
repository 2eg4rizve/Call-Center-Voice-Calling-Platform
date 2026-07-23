import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PageVisibilityService {
  private readonly visibleState = signal(typeof document === 'undefined' || !document.hidden);
  readonly isVisible = this.visibleState.asReadonly();

  constructor() {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => this.visibleState.set(!document.hidden));
    }
  }
}
