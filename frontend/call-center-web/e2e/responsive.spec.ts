import { expect, Page, test } from '@playwright/test';

const viewports = [
  { name: 'mobile', width: 360, height: 800 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
] as const;

const agent = {
  id: 'agent-id', displayName: 'Agent Demo', status: 'Available',
  lastAvailableAtUtc: '2026-07-23T10:00:00Z', callQueueNames: ['Support'],
};
const call = {
  id: 'call-id', callReferenceNumber: 'CALL-1001', direction: 'Inbound', status: 'Completed',
  customer: { id: 'customer-id', customerReferenceNumber: 'CUST-1', name: 'Test Customer', emailAddress: null, customerCategory: null, recentInteractionSummary: null, isKnownCustomer: true },
  callQueueId: 'queue-id', callQueueName: 'Support', assignedAgentId: 'agent-id', assignedAgentName: 'Agent Demo',
  createdAtUtc: '2026-07-23T10:00:00Z', assignedAtUtc: '2026-07-23T10:00:05Z', acceptedAtUtc: '2026-07-23T10:00:10Z',
  completedAtUtc: '2026-07-23T10:05:00Z', outcome: 'Resolved', notes: 'Resolved during the call.', crmSyncStatus: 'Synced', durationSeconds: 290,
};

async function mockApi(page: Page): Promise<void> {
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    let body: unknown = {};
    if (path === '/api/agents/me') body = agent;
    else if (path === '/api/agents') body = [{ ...agent, currentCallReference: null }];
    else if (path === '/api/calls/current') return route.fulfill({ status: 204 });
    else if (path === '/api/calls/history') body = { items: [call], totalCount: 1, page: 1, pageSize: 20, totalPages: 1 };
    else if (path === '/api/calls/call-id') body = { ...call, events: [{ id: 'event-id', eventType: 'Completed', eventAtUtc: call.completedAtUtc, details: null }] };
    else if (path === '/api/dashboard/metrics') body = { totalAgents: 1, availableAgents: 1, busyAgents: 0, onBreakAgents: 0, offlineAgents: 0, waitingCalls: 0, assignedCalls: 0, activeCalls: 0, completedCallsToday: 1, averageCompletedCallDurationSeconds: 290 };
    else if (path === '/api/dashboard/agents') body = { agents: [{ ...agent, currentCallReference: null }] };
    else if (path === '/api/dashboard/calls') body = { waitingCalls: [], activeCalls: [] };
    else if (path === '/api/call-queues') body = [{ id: 'queue-id', name: 'Support', description: null, isActive: true }];
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });
}

async function openAs(page: Page, role: 'Agent' | 'Supervisor', path: string): Promise<void> {
  await mockApi(page);
  await page.addInitScript(({ selectedRole }) => {
    sessionStorage.setItem('call-center.session', JSON.stringify({
      accessToken: 'responsive-test-token', expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
      userId: 'user-id', displayName: `${selectedRole} Demo`, email: `${selectedRole.toLowerCase()}@example.com`,
      role: selectedRole, agentId: selectedRole === 'Agent' ? 'agent-id' : null,
    }));
  }, { selectedRole: role });
  await page.goto(path);
}

const screens = [
  { name: 'Agent workspace', role: 'Agent', path: '/agent/workspace', heading: 'Call workspace' },
  { name: 'dashboard', role: 'Supervisor', path: '/supervisor/dashboard', heading: 'Operations dashboard' },
  { name: 'administration', role: 'Supervisor', path: '/supervisor/agents', heading: 'Agent administration' },
  { name: 'Agent history', role: 'Agent', path: '/agent/history', heading: 'My call history' },
  { name: 'details', role: 'Agent', path: '/calls/call-id', heading: 'Call details' },
] as const;

for (const viewport of viewports) {
  test.describe(`${viewport.name} responsive review`, () => {
    test.use({ viewport });

    test('login fits the viewport', async ({ page }) => {
      await page.goto('/login');
      await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    });

    for (const screen of screens) {
      test(`${screen.name} fits the viewport`, async ({ page }) => {
        await openAs(page, screen.role, screen.path);
        await expect(page.getByRole('heading', { name: screen.heading, exact: true })).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      });
    }
  });
}
