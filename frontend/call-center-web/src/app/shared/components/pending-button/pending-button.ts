import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-pending-button-content',
  imports: [MatProgressSpinnerModule],
  template: `
    @if (pending()) { <mat-spinner diameter="18" aria-hidden="true" /> }
    <span><ng-content /></span>
    @if (pending()) { <span class="visually-hidden">Action in progress</span> }
  `,
  styles: `:host { align-items: center; display: inline-flex; gap: .5rem; }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PendingButtonContent {
  readonly pending = input(false);
}
