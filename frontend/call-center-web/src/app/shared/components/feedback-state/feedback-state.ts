import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

export type FeedbackState = 'loading' | 'empty' | 'error';

@Component({
  selector: 'app-feedback-state',
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './feedback-state.html',
  styleUrl: './feedback-state.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeedbackStateComponent {
  readonly state = input.required<FeedbackState>();
  readonly title = input.required<string>();
  readonly message = input<string>('');
  readonly retryLabel = input<string>('Try again');
  readonly retry = output<void>();

  protected icon(): string {
    return this.state() === 'empty' ? 'inbox' : 'error_outline';
  }
}
