import { expect, Page, test } from '@playwright/test';

async function supervisor(page: Page): Promise<void> {
  await page.addInitScript(() => sessionStorage.setItem('call-center.session', JSON.stringify({ accessToken: 'admin-test-token', expiresAt: new Date(Date.now() + 3_600_000).toISOString(), userId: 'supervisor-id', displayName: 'Supervisor Demo', email: 'supervisor@example.com', role: 'Supervisor', agentId: null })));
}

test('Agent administration creates, edits, and assigns queue membership', async ({ page }) => {
  await supervisor(page);
  let agents = [{ id: 'agent-id', displayName: 'Agent One', status: 'Offline', lastAvailableAtUtc: null, currentCallReference: null }];
  const bodies: unknown[] = [];
  await page.route('**/api/**', async (route) => {
    const request = route.request(); const path = new URL(request.url()).pathname;
    const json = (body: unknown) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
    if (path === '/api/call-queues') return json([{ id: 'queue-id', name: 'Support', description: null, isActive: true }]);
    if (path === '/api/agents' && request.method() === 'GET') return json(agents);
    if (path === '/api/agents' && request.method() === 'POST') { bodies.push(request.postDataJSON()); agents = [...agents, { id: 'new-agent', displayName: 'Agent Two', status: 'Offline', lastAvailableAtUtc: null, currentCallReference: null }]; return json({ ...agents[1], callQueueNames: [] }); }
    if (path === '/api/agents/new-agent' && request.method() === 'PUT') { bodies.push(request.postDataJSON()); agents[1] = { ...agents[1], displayName: 'Agent Two Updated' }; return json({ ...agents[1], callQueueNames: [] }); }
    if (path === '/api/agents/call-queues') { bodies.push(request.postDataJSON()); return route.fulfill({ status: 204 }); }
    return route.fulfill({ status: 404, body: '{}' });
  });
  await page.goto('/supervisor/agents');
  const createCard = page.locator('mat-card').filter({ hasText: 'Create agent' });
  await createCard.getByLabel('Full name').fill('Agent Two'); await createCard.getByLabel('Display name').fill('Agent Two');
  await createCard.getByLabel('Email').fill('agent2@example.com'); await createCard.getByLabel('Temporary password').fill('Agent@12345');
  await createCard.getByRole('button', { name: 'Create agent' }).click();
  await expect(page.getByText('Agent Two', { exact: true }).first()).toBeVisible();
  await page.getByRole('row', { name: /Agent Two/ }).getByRole('button', { name: 'Manage' }).click();
  const manageCard = page.locator('mat-card').filter({ hasText: 'Manage Agent Two' });
  await manageCard.getByLabel('Display name').fill('Agent Two Updated'); await manageCard.getByRole('button', { name: 'Save name' }).click();
  await expect(page.getByText('Agent Two Updated', { exact: true }).first()).toBeVisible();
  await page.getByRole('row', { name: /Agent Two Updated/ }).getByRole('button', { name: 'Manage' }).click();
  const updatedManageCard = page.locator('mat-card').filter({ hasText: 'Manage Agent Two Updated' });
  await updatedManageCard.getByRole('combobox', { name: 'Add to queue' }).click(); await page.getByRole('option', { name: 'Support' }).click();
  await updatedManageCard.getByRole('button', { name: 'Assign queue' }).click();
  await expect(page.getByText('Queue assignment saved. Existing assignments remain unchanged.')).toBeVisible();
  expect(bodies).toContainEqual({ agentId: 'new-agent', callQueueId: 'queue-id' });
});

test('queue administration creates, edits, and deactivates a queue', async ({ page }) => {
  await supervisor(page); let queues: Array<{ id: string; name: string; description: string | null; isActive: boolean }> = [];
  await page.route('**/api/call-queues**', async (route) => {
    const request = route.request(); const path = new URL(request.url()).pathname;
    const json = (body: unknown) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
    if (path === '/api/call-queues' && request.method() === 'GET') return json(queues.filter((queue) => queue.isActive));
    if (path === '/api/call-queues' && request.method() === 'POST') { queues = [{ id: 'queue-id', name: 'Sales', description: 'Inbound sales', isActive: true }]; return json(queues[0]); }
    if (path === '/api/call-queues/queue-id') { const body = request.postDataJSON() as typeof queues[number]; queues[0] = { id: 'queue-id', ...body }; return json(queues[0]); }
    return route.fulfill({ status: 404, body: '{}' });
  });
  await page.goto('/supervisor/queues');
  await page.getByLabel('Queue name').fill('Sales'); await page.getByLabel('Description').fill('Inbound sales'); await page.getByRole('button', { name: 'Create queue' }).click();
  await page.getByRole('row', { name: /Sales/ }).getByRole('button', { name: 'Manage' }).click();
  await page.getByLabel('Description').fill('Priority sales'); await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText('Priority sales')).toBeVisible();
  await page.getByRole('row', { name: /Sales Priority sales/ }).getByRole('button', { name: 'Manage' }).click();
  await page.getByRole('button', { name: 'Deactivate queue' }).click(); await page.getByRole('dialog').getByRole('button', { name: 'Deactivate queue' }).click();
  await expect(page.getByRole('heading', { name: 'No active queues' })).toBeVisible();
});

test('customer administration handles lookup, create, and update', async ({ page }) => {
  await supervisor(page); let customer: Record<string, unknown> | null = null;
  await page.route('**/api/customers**', async (route) => {
    const request = route.request(); const path = new URL(request.url()).pathname;
    const json = (body: unknown) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
    if (path === '/api/customers/lookup') return customer ? json(customer) : route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
    if (path === '/api/customers' && request.method() === 'POST') { const body = request.postDataJSON() as Record<string, unknown>; customer = { id: 'customer-id', customerReferenceNumber: 'CUST-1', name: body['name'], emailAddress: body['emailAddress'], customerCategory: body['customerCategory'], recentInteractionSummary: body['recentInteractionSummary'], isKnownCustomer: true }; return json(customer); }
    if (path === '/api/customers/customer-id' && request.method() === 'GET') return json(customer);
    if (path === '/api/customers/customer-id' && request.method() === 'PUT') { customer = { ...customer, ...(request.postDataJSON() as object) }; return json(customer); }
    return route.fulfill({ status: 404, body: '{}' });
  });
  await page.goto('/supervisor/customers');
  const lookup = page.locator('form.lookup'); await lookup.getByLabel('Phone number').fill('+8801712345678'); await lookup.getByRole('button', { name: 'Search customer' }).click();
  await expect(page.getByText('Customer not found')).toBeVisible();
  const create = page.locator('mat-card').filter({ hasText: 'Create customer' }); await create.getByLabel('Name').fill('Customer One'); await create.getByLabel('Email address').fill('customer@example.com');
  await create.getByRole('button', { name: 'Create customer' }).click(); await expect(page.getByText('CUST-1').first()).toBeVisible();
  const edit = page.locator('mat-card').filter({ hasText: 'Edit customer' }); await edit.getByLabel('Name').fill('Customer Updated'); await edit.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText('Customer Updated', { exact: true }).first()).toBeVisible();
});
