import { expect, test } from '@playwright/test';

test('login page loads', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  await expect(page.getByLabel('Email address')).toBeVisible();
});

test('protected route redirects anonymous users to sign in', async ({ page }) => {
  await page.goto('/supervisor/dashboard');
  await expect(page).toHaveURL(/\/login\?returnUrl=/);
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
});

test('invalid credentials stay on login and show a safe error', async ({ page }) => {
  await page.route('**/api/auth/login', (route) => route.fulfill({
    status: 401,
    contentType: 'application/json',
    body: JSON.stringify({ statusCode: 401, code: 'invalid_credentials', message: 'Internal detail must not leak.' }),
  }));
  await page.goto('/login');
  await page.getByLabel('Email address').fill('unknown@example.com');
  await page.getByLabel('Password', { exact: true }).fill('Wrong@123');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('alert')).toHaveText('Email or password is incorrect. Check your credentials and try again.');
  expect(await page.evaluate(() => sessionStorage.getItem('call-center.session'))).toBeNull();
});

for (const account of [
  { role: 'Agent', email: 'agent1@callcenter.local', destination: '/agent/workspace', heading: 'Call workspace', agentId: 'agent-id' },
  { role: 'Supervisor', email: 'supervisor@callcenter.local', destination: '/supervisor/dashboard', heading: 'Operations dashboard', agentId: null },
]) {
  test(`${account.role} login redirects to the correct workspace`, async ({ page }) => {
    await page.route('**/api/auth/login', async (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        accessToken: 'test-token', expiresAt: new Date(Date.now() + 60_000).toISOString(), userId: 'user-id',
        displayName: `${account.role} Demo`, email: account.email, role: account.role, agentId: account.agentId,
      }),
    }));
    await page.route('**/api/**', async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path === '/api/auth/login') return route.fallback();
      if (path === '/api/agents/me') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'agent-id', displayName: 'Agent Demo', status: 'Available', lastAvailableAtUtc: null, callQueueNames: [] }) });
      if (path === '/api/calls/current') return route.fulfill({ status: 204 });
      if (path === '/api/dashboard/metrics') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ totalAgents: 0, availableAgents: 0, busyAgents: 0, onBreakAgents: 0, offlineAgents: 0, waitingCalls: 0, assignedCalls: 0, activeCalls: 0, completedCallsToday: 0, averageCompletedCallDurationSeconds: 0 }) });
      if (path === '/api/dashboard/agents') return route.fulfill({ status: 200, contentType: 'application/json', body: '{"agents":[]}' });
      if (path === '/api/dashboard/calls') return route.fulfill({ status: 200, contentType: 'application/json', body: '{"waitingCalls":[],"activeCalls":[]}' });
      if (path === '/api/call-queues') return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
      await route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
    });
    await page.goto('/login');
    await page.getByLabel('Email address').fill(account.email);
    await page.getByLabel('Password', { exact: true }).fill('Demo@12345');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${account.destination}$`));
    await expect(page.getByRole('heading', { name: account.heading, exact: true })).toBeVisible();
    expect(await page.evaluate(() => sessionStorage.getItem('call-center.session'))).not.toBeNull();

    await page.getByRole('button', { name: 'Log out' }).click();
    await expect(page).toHaveURL(/\/login$/);
    expect(await page.evaluate(() => sessionStorage.getItem('call-center.session'))).toBeNull();
  });
}
