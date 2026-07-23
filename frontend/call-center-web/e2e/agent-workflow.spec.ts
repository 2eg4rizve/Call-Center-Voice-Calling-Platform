import { expect, test } from '@playwright/test';

test('Agent changes availability, accepts and completes a call, then reviews history and details', async ({ page }) => {
  let profileStatus = 'Offline';
  let callState: 'none' | 'Assigned' | 'Active' = 'none';
  const baseCall = {
    id: 'call-id', callReferenceNumber: 'CALL-1001', direction: 'Inbound',
    customer: { id: 'customer-id', customerReferenceNumber: 'CUST-1', name: 'Test Customer', emailAddress: null, customerCategory: 'VIP', recentInteractionSummary: null, isKnownCustomer: true },
    callQueueId: 'queue-id', callQueueName: 'Support', assignedAgentId: 'agent-id', assignedAgentName: 'Agent Demo',
    createdAtUtc: '2026-07-23T10:00:00Z', assignedAtUtc: '2026-07-23T10:00:05Z',
    acceptedAtUtc: null, completedAtUtc: null, outcome: null, notes: null, crmSyncStatus: 'Pending', durationSeconds: null,
  };

  await page.addInitScript(() => sessionStorage.setItem('call-center.session', JSON.stringify({
    accessToken: 'agent-workflow-token', expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
    userId: 'agent-user-id', displayName: 'Agent Demo', email: 'agent@example.com', role: 'Agent', agentId: 'agent-id',
  })));

  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path === '/api/agents/me' && request.method() === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'agent-id', displayName: 'Agent Demo', status: profileStatus, lastAvailableAtUtc: null, callQueueNames: ['Support'] }) });
    }
    if (path === '/api/agents/me/status') {
      profileStatus = 'Available';
      callState = 'Assigned';
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'agent-id', displayName: 'Agent Demo', status: profileStatus, lastAvailableAtUtc: new Date().toISOString(), callQueueNames: ['Support'] }) });
    }
    if (path === '/api/calls/current') {
      if (callState === 'none') return route.fulfill({ status: 204 });
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...baseCall, status: callState, acceptedAtUtc: callState === 'Active' ? new Date(Date.now() - 5_000).toISOString() : null }) });
    }
    if (path === '/api/calls/call-id/accept') {
      callState = 'Active';
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...baseCall, status: 'Active', acceptedAtUtc: new Date(Date.now() - 5_000).toISOString() }) });
    }
    if (path === '/api/calls/call-id/complete') {
      callState = 'none';
      profileStatus = 'Available';
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...baseCall, status: 'Completed', completedAtUtc: new Date().toISOString(), outcome: 'Resolved', notes: 'Customer issue resolved.', crmSyncStatus: 'Synced', durationSeconds: 95 }) });
    }
    if (path === '/api/calls/history') {
      const history = { ...baseCall, status: 'Completed', customerName: 'Test Customer', agentName: 'Agent Demo', completedAtUtc: '2026-07-23T10:01:35Z', outcome: 'Resolved', crmSyncStatus: 'Synced', durationSeconds: 95 };
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [history], totalCount: 1, page: 1, pageSize: 20, totalPages: 1 }) });
    }
    if (path === '/api/calls/call-id') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...baseCall, status: 'Completed', completedAtUtc: '2026-07-23T10:01:35Z', outcome: 'Resolved', notes: 'Customer issue resolved.', crmSyncStatus: 'Synced', durationSeconds: 95, events: [{ id: 'event-2', eventType: 'Completed', eventAtUtc: '2026-07-23T10:01:35Z', details: 'Resolved' }, { id: 'event-1', eventType: 'Created', eventAtUtc: '2026-07-23T10:00:00Z', details: null }] }) });
    }
    await route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
  });

  await page.goto('/agent/workspace');
  await expect(page.locator('app-status-chip').getByText('Offline', { exact: true })).toBeVisible();
  const statusCall = page.waitForRequest('**/api/agents/me/status');
  await page.getByRole('button', { name: 'Available', exact: true }).click();
  expect((await statusCall).postDataJSON()).toEqual({ status: 'Available' });

  await expect(page.getByText('CALL-1001', { exact: true })).toBeVisible({ timeout: 5_000 });
  await page.getByRole('button', { name: 'Accept call' }).click();
  await expect(page.getByText('Elapsed', { exact: true })).toBeVisible();
  const outcome = page.getByRole('combobox', { name: 'Outcome' });
  await outcome.click();
  await page.getByRole('option', { name: 'Resolved', exact: true }).click();
  await page.getByLabel('Notes').fill('Customer issue resolved.');
  await expect(outcome).toContainText('Resolved');
  await expect(page.getByLabel('Notes')).toHaveValue('Customer issue resolved.');
  const [completeCall] = await Promise.all([
    page.waitForRequest((request) => new URL(request.url()).pathname === '/api/calls/call-id/complete'),
    page.getByRole('button', { name: 'Complete call' }).click(),
  ]);
  expect(completeCall.postDataJSON()).toEqual({ outcome: 'Resolved', notes: 'Customer issue resolved.' });
  await expect(page.getByRole('heading', { name: 'You are ready' })).toBeVisible();

  await page.getByRole('link', { name: 'My history' }).click();
  await expect(page.getByRole('heading', { name: 'My call history' })).toBeVisible();
  await page.getByRole('link', { name: 'CALL-1001' }).click();
  await expect(page.getByRole('heading', { name: 'Call details', exact: true })).toBeVisible();
  await expect(page.getByText('Customer issue resolved.', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Event timeline' })).toBeVisible();
});
