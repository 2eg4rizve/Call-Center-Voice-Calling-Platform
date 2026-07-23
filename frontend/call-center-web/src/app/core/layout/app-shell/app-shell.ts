import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AuthStore } from '../../auth/auth.store';
import { NotificationService } from '../../services/notification.service';

interface NavItem { label: string; path: string; icon: string }

@Component({
  selector: 'app-shell',
  imports: [MatButtonModule, MatIconModule, MatSidenavModule, MatToolbarModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShell {
  protected readonly auth = inject(AuthStore);
  protected readonly notifications = inject(NotificationService);
  protected readonly menuOpen = signal(false);

  protected readonly agentNav: NavItem[] = [
    { label: 'Workspace', path: '/agent/workspace', icon: 'headset_mic' },
    { label: 'My history', path: '/agent/history', icon: 'history' },
  ];
  protected readonly supervisorNav: NavItem[] = [
    { label: 'Dashboard', path: '/supervisor/dashboard', icon: 'dashboard' },
    { label: 'Call history', path: '/supervisor/history', icon: 'history' },
    { label: 'Agents', path: '/supervisor/agents', icon: 'support_agent' },
    { label: 'Queues', path: '/supervisor/queues', icon: 'account_tree' },
    { label: 'Customers', path: '/supervisor/customers', icon: 'groups' },
  ];

  protected navItems(): NavItem[] {
    return this.auth.role() === 'Agent' ? this.agentNav : this.supervisorNav;
  }

  protected logout(): void { this.auth.logout(); }
}
