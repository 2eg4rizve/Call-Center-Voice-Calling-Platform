import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class SnackbarNotificationService {
  private readonly snackbar = inject(MatSnackBar);
  show(message: string, action = 'Dismiss', duration = 5000): void {
    this.snackbar.open(message, action, { duration, horizontalPosition: 'end', verticalPosition: 'top' });
  }
}
