import { booleanAttribute, Directive, HostBinding, input } from '@angular/core';

@Directive({ selector: 'button[appPendingAction]', standalone: true })
export class PendingActionDirective {
  readonly appPendingAction = input(false, { transform: booleanAttribute });
  @HostBinding('disabled') get disabled(): boolean { return this.appPendingAction(); }
  @HostBinding('attr.aria-busy') get ariaBusy(): string { return String(this.appPendingAction()); }
}
