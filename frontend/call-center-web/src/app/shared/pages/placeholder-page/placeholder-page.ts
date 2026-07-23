import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { PageHeader } from '../../components/page-header/page-header';
import { StatusChip } from '../../components/status-chip/status-chip';

@Component({
  selector: 'app-placeholder-page',
  imports: [MatButtonModule, MatCardModule, PageHeader, RouterLink, StatusChip],
  templateUrl: './placeholder-page.html',
  styleUrl: './placeholder-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlaceholderPage {
  private readonly route = inject(ActivatedRoute);

  protected readonly title = this.route.snapshot.data['title'] as string;
  protected readonly area = this.route.snapshot.data['area'] as string;
}
