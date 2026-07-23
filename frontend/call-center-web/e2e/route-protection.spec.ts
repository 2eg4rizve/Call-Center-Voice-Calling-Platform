import { expect, Page, test } from '@playwright/test';

async function addSession(page: Page, role: 'Agent' | 'Supervisor'): Promise<void> {
  await page.addInitScript(({ currentRole }) => {
    sessionStorage.setItem('call-center.session', JSON.stringify({
      accessToken: 'route-test-token', expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
      userId: 'user-id', displayName: `${currentRole} Demo`, email: `${currentRole.toLowerCase()}@example.com`,
      role: currentRole, agentId: currentRole === 'Agent' ? 'agent-id' : null,
    }));
  }, { currentRole: role });
}

test('anonymous users cannot open Agent or Supervisor routes', async ({ page }) => {
  for (const protectedPath of ['/agent/workspace', '/supervisor/dashboard']) {
    await page.goto(protectedPath);
    await expect(page).toHaveURL(/\/login\?returnUrl=/);
    expect(new URL(page.url()).searchParams.get('returnUrl')).toBe(protectedPath);
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  }
});

for (const scenario of [
  { role: 'Agent', deniedPath: '/supervisor/dashboard' },
  { role: 'Supervisor', deniedPath: '/agent/workspace' },
] as const) {
  test(`${scenario.role} cannot access the other role workspace`, async ({ page }) => {
    await addSession(page, scenario.role);
    await page.goto(scenario.deniedPath);
    await expect(page).toHaveURL(/\/unauthorized$/);
    await expect(page.getByRole('heading', { name: 'Access denied', exact: true })).toBeVisible();
  });
}

test('authenticated users cannot return to the guest login route', async ({ page }) => {
  await addSession(page, 'Agent');
  await page.route('**/api/agents/me', (route) => route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ id: 'agent-id', displayName: 'Agent Demo', status: 'Available', lastAvailableAtUtc: null, callQueueNames: [] }),
  }));
  await page.route('**/api/calls/current', (route) => route.fulfill({ status: 204 }));
  await page.goto('/login');
  await expect(page).toHaveURL(/\/agent\/workspace$/);
  await expect(page.getByRole('heading', { name: 'Call workspace', exact: true })).toBeVisible();
});
