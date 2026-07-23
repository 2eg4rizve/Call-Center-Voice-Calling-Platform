import { inject, Injectable } from '@angular/core';
import { LiveAnnouncer } from '@angular/cdk/a11y';

@Injectable({ providedIn: 'root' })
export class AppLiveAnnouncer {
  private readonly announcer = inject(LiveAnnouncer);
  announce(message: string, assertive = false): void {
    void this.announcer.announce(message, assertive ? 'assertive' : 'polite');
  }
}
