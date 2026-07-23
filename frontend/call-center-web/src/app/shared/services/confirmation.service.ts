import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { ConfirmationDialog, ConfirmationDialogData } from '../components/confirmation-dialog/confirmation-dialog';

@Injectable({ providedIn: 'root' })
export class ConfirmationService {
  private readonly dialog = inject(MatDialog);
  confirm(data: ConfirmationDialogData): Observable<boolean | undefined> {
    return this.dialog.open<ConfirmationDialog, ConfirmationDialogData, boolean>(ConfirmationDialog, {
      data, maxWidth: '28rem', width: 'calc(100vw - 2rem)', autoFocus: 'first-tabbable', restoreFocus: true,
    }).afterClosed();
  }
}
