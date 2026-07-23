import { expect, Page, test } from '@playwright/test';

async function supervisorSession(page: Page): Promise<void> {
  await page.addInitScript(() => {
    sessionStorage.setItem('call-center.session', JSON.stringify({
      accessToken: 'accessibility-test-token', expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
      userId: 'supervisor-id', displayName: 'Supervisor Demo', email: 'supervisor@example.com',
      role: 'Supervisor', agentId: null,
    }));
  });
}

test('login supports labelled keyboard navigation and visible focus', async ({ page }) => {
  await page.goto('/login');
  const email = page.getByLabel('Email address');
  const password = page.getByLabel('Password', { exact: true });
  const toggle = page.getByRole('button', { name: 'Show password' });
  const submit = page.getByRole('button', { name: 'Sign in', exact: true });

  await expect(email).toHaveAttribute('type', 'email');
  await expect(password).toHaveAttribute('autocomplete', 'current-password');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Call Center home' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(email).toBeFocused();
  const outline = await email.evaluate((element) => getComputedStyle(element).outlineStyle);
  expect(outline).not.toBe('none');
  await page.keyboard.press('Tab');
  await expect(password).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(toggle).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(submit).toBeFocused();
});

test('confirmation dialog traps focus and restores it to the trigger', async ({ page }) => {
  await supervisorSession(page);
  await page.route('**/api/call-queues', (route) => route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify([{ id: 'queue-id', name: 'Support', description: 'Customer support', isActive: true }]),
  }));
  await page.goto('/supervisor/queues');
  await page.getByRole('button', { name: 'Manage' }).click();
  const trigger = page.getByRole('button', { name: 'Deactivate queue' });
  await trigger.focus();
  await trigger.press('Enter');

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('heading', { name: 'Deactivate Support?' })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(dialog.getByRole('button', { name: 'Deactivate queue' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test('loading and failure states expose live announcements', async ({ page }) => {
  await supervisorSession(page);
  await page.route('**/api/dashboard/metrics', (route) => route.fulfill({ status: 500, contentType: 'application/json', body: '{}' }));
  await page.route('**/api/dashboard/agents', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"agents":[]}' }));
  await page.route('**/api/dashboard/calls', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"waitingCalls":[],"activeCalls":[]}' }));
  await page.route('**/api/call-queues', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await page.goto('/supervisor/dashboard');

  const announcement = page.locator('[aria-live="assertive"]');
  await expect(announcement).toContainText('Dashboard unavailable');
  await expect(announcement).toHaveAttribute('aria-busy', 'false');
});
