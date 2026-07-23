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

for (const account of [
  { role: 'Agent', email: 'agent1@callcenter.local', destination: '/agent/workspace', heading: 'Agent workspace', agentId: 'agent-id' },
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
    await page.goto('/login');
    await page.getByLabel('Email address').fill(account.email);
    await page.getByLabel('Password', { exact: true }).fill('Demo@12345');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${account.destination}$`));
    await expect(page.getByRole('heading', { name: account.heading })).toBeVisible();
  });
}
