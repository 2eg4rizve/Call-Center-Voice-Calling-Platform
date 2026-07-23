import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  template: `<header><div><p class="eyebrow">{{ eyebrow() }}</p><h1>{{ title() }}</h1>@if (description()) { <p class="description">{{ description() }}</p> }</div><div class="actions"><ng-content /></div></header>`,
  styleUrl: './page-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHeader {
  readonly title = input.required<string>();
  readonly eyebrow = input<string>('');
  readonly description = input<string>('');
}
