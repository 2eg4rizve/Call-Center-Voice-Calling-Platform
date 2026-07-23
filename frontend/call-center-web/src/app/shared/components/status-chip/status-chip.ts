import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { statusPresentation } from '../../models/status.model';

@Component({
  selector: 'app-status-chip',
  template: `<span class="chip" [class]="'chip chip--' + presentation().tone"><span class="dot" aria-hidden="true"></span>{{ presentation().label }}</span>`,
  styleUrl: './status-chip.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusChip {
  readonly status = input.required<string>();
  protected readonly presentation = computed(() => statusPresentation(this.status()));
}
