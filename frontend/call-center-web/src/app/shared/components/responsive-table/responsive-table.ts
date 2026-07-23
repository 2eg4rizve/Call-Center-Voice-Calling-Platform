import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-responsive-table',
  template: `<div class="table-scroll" tabindex="0" role="region" [attr.aria-label]="label()"><ng-content /></div>`,
  styles: `.table-scroll { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: .75rem; max-width: 100%; overflow-x: auto; } .table-scroll:focus-visible { outline: 3px solid #84adff; } :host ::ng-deep table { border-collapse: collapse; min-width: 42rem; width: 100%; } :host ::ng-deep th, :host ::ng-deep td { border-bottom: 1px solid var(--color-border); padding: .8rem 1rem; text-align: left; }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResponsiveTable { readonly label = input.required<string>(); }
