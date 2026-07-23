import { Injectable, signal } from '@angular/core';

export type NotificationKind = 'info' | 'success' | 'warning' | 'error';
export interface AppNotification { message: string; kind: NotificationKind }

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly state = signal<AppNotification | null>(null);
  readonly current = this.state.asReadonly();

  show(message: string, kind: NotificationKind = 'info'): void {
    this.state.set({ message, kind });
  }

  dismiss(): void {
    this.state.set(null);
  }
}
