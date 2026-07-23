import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { landingGuard, roleGuard } from './core/guards/role.guard';

const placeholder = () =>
  import('./shared/pages/placeholder-page/placeholder-page').then((m) => m.PlaceholderPage);
const shell = () => import('./core/layout/app-shell/app-shell').then((m) => m.AppShell);

export const routes: Routes = [
  { path: '', pathMatch: 'full', canActivate: [landingGuard], loadComponent: placeholder },
  { path: 'login', canActivate: [guestGuard], loadComponent: () => import('./features/auth/login-page/login-page').then((m) => m.LoginPage) },
  {
    path: 'agent', canActivate: [authGuard, roleGuard], data: { role: 'Agent' }, loadComponent: shell,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'workspace' },
      { path: 'workspace', loadComponent: () => import('./features/agent/workspace/agent-workspace').then((m) => m.AgentWorkspace) },
      { path: 'history', loadComponent: () => import('./features/agent/history/agent-history').then((m) => m.AgentHistory) },
    ],
  },
  {
    path: 'supervisor', canActivate: [authGuard, roleGuard], data: { role: 'Supervisor' }, loadComponent: shell,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', loadComponent: placeholder, data: { title: 'Operations dashboard', area: 'Supervisor' } },
      { path: 'history', loadComponent: placeholder, data: { title: 'Call history', area: 'Supervisor' } },
      { path: 'agents', loadComponent: () => import('./features/supervisor/agents/agent-administration').then((m) => m.AgentAdministration) },
      { path: 'queues', loadComponent: placeholder, data: { title: 'Queue administration', area: 'Supervisor' } },
      { path: 'customers', loadComponent: placeholder, data: { title: 'Customer administration', area: 'Supervisor' } },
    ],
  },
  {
    path: 'calls', canActivate: [authGuard], loadComponent: shell,
    children: [{ path: ':id', loadComponent: placeholder, data: { title: 'Call details', area: 'Calls' } }],
  },
  { path: 'unauthorized', loadComponent: placeholder, data: { title: 'Access denied', area: 'System' } },
  { path: '**', loadComponent: placeholder, data: { title: 'Page not found', area: 'System' } },
];
