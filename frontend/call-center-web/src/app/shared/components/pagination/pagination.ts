import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-pagination', imports: [MatButtonModule],
  template: `<nav aria-label="Pagination"><span>Page {{ page() }} of {{ totalPages() }} · {{ total() }} items</span><div><button matButton type="button" [disabled]="page() <= 1" (click)="pageChange.emit(page() - 1)">Previous</button><button matButton type="button" [disabled]="page() >= totalPages()" (click)="pageChange.emit(page() + 1)">Next</button></div></nav>`,
  styles: `nav { align-items: center; color: var(--color-text-muted); display: flex; font-size: .875rem; justify-content: space-between; padding-block: 1rem; } @media(max-width:480px){ nav { align-items: stretch; flex-direction: column; gap: .5rem; } nav div { display:flex; justify-content:space-between; } }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Pagination {
  readonly page = input(1); readonly pageSize = input(20); readonly total = input(0); readonly pageChange = output<number>();
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));
}
