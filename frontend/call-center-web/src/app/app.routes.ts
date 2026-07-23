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
      { path: 'dashboard', loadComponent: () => import('./features/supervisor/dashboard/supervisor-dashboard').then((m) => m.SupervisorDashboard) },
      { path: 'history', loadComponent: () => import('./features/supervisor/history/supervisor-history').then((m) => m.SupervisorHistory) },
      { path: 'agents', loadComponent: () => import('./features/supervisor/agents/agent-administration').then((m) => m.AgentAdministration) },
      { path: 'queues', loadComponent: () => import('./features/supervisor/queues/queue-administration').then((m) => m.QueueAdministration) },
      { path: 'customers', loadComponent: () => import('./features/supervisor/customers/customer-administration').then((m) => m.CustomerAdministration) },
      { path: 'customers/:customerId', loadComponent: () => import('./features/supervisor/customers/customer-administration').then((m) => m.CustomerAdministration) },
    ],
  },
  {
    path: 'calls', canActivate: [authGuard], loadComponent: shell,
    children: [{ path: ':id', loadComponent: () => import('./features/calls/call-details').then((m) => m.CallDetails) }],
  },
  { path: 'unauthorized', loadComponent: placeholder, data: { title: 'Access denied', area: 'System' } },
  { path: '**', loadComponent: placeholder, data: { title: 'Page not found', area: 'System' } },
];
