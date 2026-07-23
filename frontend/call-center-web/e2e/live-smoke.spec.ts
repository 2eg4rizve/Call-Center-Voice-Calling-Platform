import { expect, test } from '@playwright/test';

test('@live seeded Supervisor-to-Agent call lifecycle', async ({ page }) => {
  test.skip(process.env['LIVE_API_SMOKE'] !== '1', 'Set LIVE_API_SMOKE=1 against an isolated seeded API.');
  const agentEmail = process.env['LIVE_AGENT_EMAIL'] ?? 'agent1@callcenter.local';
  const supervisorEmail = process.env['LIVE_SUPERVISOR_EMAIL'] ?? 'supervisor@callcenter.local';
  const password = process.env['LIVE_PASSWORD'] ?? 'Demo@12345';
  const phone = process.env['LIVE_CALLER_PHONE'] ?? '+8801712345678';
  const queueName = process.env['LIVE_QUEUE_NAME'] ?? 'Customer Support';

  const login = async (email: string) => {
    await page.goto('/login'); await page.getByLabel('Email address').fill(email); await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  };

  await login(agentEmail);
  await expect(page).toHaveURL(/\/agent\/workspace$/);
  await page.getByRole('button', { name: 'Available', exact: true }).click();
  await page.getByRole('button', { name: 'Log out' }).click();

  await login(supervisorEmail);
  await expect(page).toHaveURL(/\/supervisor\/dashboard$/);
  await page.getByRole('radio', { name: 'Unknown caller' }).check();
  await page.getByLabel('Caller phone').fill(phone);
  await page.getByRole('combobox', { name: 'Active queue' }).click(); await page.getByRole('option', { name: queueName, exact: true }).click();
  await page.getByRole('button', { name: 'Create inbound call' }).click();
  const reference = (await page.locator('.created strong').textContent())?.trim();
  expect(reference).toBeTruthy();
  await page.getByRole('row', { name: new RegExp(reference!) }).getByRole('button', { name: 'Assign' }).click();
  await page.getByRole('button', { name: 'Log out' }).click();

  await login(agentEmail);
  await expect(page.getByText(reference!, { exact: true })).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: 'Accept call' }).click();
  await page.getByRole('combobox', { name: 'Outcome' }).click(); await page.getByRole('option', { name: 'Resolved', exact: true }).click();
  await page.getByLabel('Notes').fill('Playwright live smoke completion.');
  await page.getByRole('button', { name: 'Complete call' }).click();
  await expect(page.getByRole('heading', { name: 'You are ready' })).toBeVisible();
});
