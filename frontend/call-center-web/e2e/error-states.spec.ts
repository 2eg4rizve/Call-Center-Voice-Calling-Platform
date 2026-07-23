import { expect, Page, test } from '@playwright/test';

async function session(page: Page, role: 'Agent' | 'Supervisor' = 'Agent'): Promise<void> {
  await page.addInitScript(({ selectedRole }) => sessionStorage.setItem('call-center.session', JSON.stringify({ accessToken: 'error-test-token', expiresAt: new Date(Date.now() + 3_600_000).toISOString(), userId: 'user-id', displayName: `${selectedRole} Demo`, email: 'user@example.com', role: selectedRole, agentId: selectedRole === 'Agent' ? 'agent-id' : null })), { selectedRole: role });
}

test('client validation and unavailable login API show actionable messages', async ({ page }) => {
  await page.goto('/login'); await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByText('Email address required.')).toBeVisible(); await expect(page.getByText('Password required.')).toBeVisible();
  await page.route('**/api/auth/login', (route) => route.abort('connectionrefused'));
  await page.getByLabel('Email address').fill('agent@example.com'); await page.getByLabel('Password', { exact: true }).fill('Demo@12345'); await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Server-er sathe connect kora jacche na');
});

test('204 current call and empty history render non-error empty states', async ({ page }) => {
  await session(page);
  await page.route('**/api/agents/me', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"id":"agent-id","displayName":"Agent Demo","status":"Available","lastAvailableAtUtc":null,"callQueueNames":[]}' }));
  await page.route('**/api/calls/current', (route) => route.fulfill({ status: 204 }));
  await page.route('**/api/calls/history**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"items":[],"totalCount":0,"page":1,"pageSize":20,"totalPages":0}' }));
  await page.goto('/agent/workspace'); await expect(page.getByRole('heading', { name: 'You are ready' })).toBeVisible();
  await page.goto('/agent/history'); await expect(page.getByRole('heading', { name: 'No calls found' })).toBeVisible();
});

for (const item of [
  { status: 401, destination: /\/login\?returnUrl=/, heading: 'Welcome back' },
  { status: 403, destination: /\/unauthorized$/, heading: 'Access denied' },
] as const) {
  test(`${item.status} response applies the global authorization behavior`, async ({ page }) => {
    await session(page); await page.route('**/api/calls/call-id', (route) => route.fulfill({ status: item.status, contentType: 'application/json', body: '{}' }));
    await page.goto('/calls/call-id'); await expect(page).toHaveURL(item.destination); await expect(page.getByRole('heading', { name: item.heading, exact: true })).toBeVisible();
  });
}

test('404 call details renders a dedicated not-found state', async ({ page }) => {
  await session(page); await page.route('**/api/calls/missing', (route) => route.fulfill({ status: 404, contentType: 'application/json', body: '{}' }));
  await page.goto('/calls/missing'); await expect(page.getByRole('heading', { name: 'Call not found' })).toBeVisible();
});

test('500 dashboard response renders a retryable unavailable state', async ({ page }) => {
  await session(page, 'Supervisor');
  await page.route('**/api/call-queues', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await page.route('**/api/dashboard/metrics', (route) => route.fulfill({ status: 500, contentType: 'application/json', body: '{}' }));
  await page.route('**/api/dashboard/agents', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"agents":[]}' }));
  await page.route('**/api/dashboard/calls', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"waitingCalls":[],"activeCalls":[]}' }));
  await page.goto('/supervisor/dashboard'); await expect(page.getByRole('heading', { name: 'Dashboard unavailable' })).toBeVisible(); await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
});

test('409 assignment conflict informs the user and refreshes dashboard state', async ({ page }) => {
  await session(page, 'Supervisor'); let callReads = 0;
  const waitingCall = { id: 'call-id', callReferenceNumber: 'CALL-409', direction: 'Inbound', status: 'Waiting', customer: null, callQueueId: 'queue-id', callQueueName: 'Support', assignedAgentId: null, assignedAgentName: null, createdAtUtc: '2026-07-23T10:00:00Z', assignedAtUtc: null, acceptedAtUtc: null, completedAtUtc: null, outcome: null, notes: null, crmSyncStatus: 'Pending', durationSeconds: null };
  await page.route('**/api/**', async (route) => { const path = new URL(route.request().url()).pathname; const json = (body: unknown) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
    if (path === '/api/call-queues') return json([]); if (path === '/api/dashboard/metrics') return json({ totalAgents: 1, availableAgents: 1, busyAgents: 0, onBreakAgents: 0, offlineAgents: 0, waitingCalls: 1, assignedCalls: 0, activeCalls: 0, completedCallsToday: 0, averageCompletedCallDurationSeconds: 0 });
    if (path === '/api/dashboard/agents') return json({ agents: [] }); if (path === '/api/dashboard/calls') { callReads++; return json({ waitingCalls: [waitingCall], activeCalls: [] }); }
    if (path === '/api/calls/call-id/assign') return route.fulfill({ status: 409, contentType: 'application/json', body: '{}' }); return route.fulfill({ status: 404, body: '{}' }); });
  await page.goto('/supervisor/dashboard'); await page.getByRole('button', { name: 'Assign', exact: true }).click();
  await expect(page.getByText('Call state changed. Dashboard refresh kora hocche.')).toBeVisible(); await expect.poll(() => callReads).toBeGreaterThan(1);
});
