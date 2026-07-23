import { expect, test } from '@playwright/test';

test('Supervisor creates and assigns a call, then reviews refreshed history and details', async ({ page }) => {
  let phase: 'empty' | 'waiting' | 'assigned' = 'empty';
  const call = {
    id: 'call-id', callReferenceNumber: 'CALL-2001', direction: 'Inbound', status: 'Waiting', customer: null,
    callQueueId: 'queue-id', callQueueName: 'Support', assignedAgentId: null, assignedAgentName: null,
    createdAtUtc: '2026-07-23T10:00:00Z', assignedAtUtc: null, acceptedAtUtc: null, completedAtUtc: null,
    outcome: null, notes: null, crmSyncStatus: 'Pending', durationSeconds: null,
  };
  await page.addInitScript(() => sessionStorage.setItem('call-center.session', JSON.stringify({
    accessToken: 'supervisor-workflow-token', expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
    userId: 'supervisor-id', displayName: 'Supervisor Demo', email: 'supervisor@example.com', role: 'Supervisor', agentId: null,
  })));
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const json = (body: unknown) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
    if (path === '/api/call-queues') return json([{ id: 'queue-id', name: 'Support', description: null, isActive: true }]);
    if (path === '/api/dashboard/metrics') return json({ totalAgents: 1, availableAgents: phase === 'assigned' ? 0 : 1, busyAgents: phase === 'assigned' ? 1 : 0, onBreakAgents: 0, offlineAgents: 0, waitingCalls: phase === 'waiting' ? 1 : 0, assignedCalls: phase === 'assigned' ? 1 : 0, activeCalls: 0, completedCallsToday: 0, averageCompletedCallDurationSeconds: 0 });
    if (path === '/api/dashboard/agents') return json({ agents: [{ id: 'agent-id', displayName: 'Agent Demo', status: phase === 'assigned' ? 'Busy' : 'Available', lastAvailableAtUtc: null, currentCallReference: phase === 'assigned' ? call.callReferenceNumber : null }] });
    if (path === '/api/dashboard/calls') return json({ waitingCalls: phase === 'waiting' ? [call] : [], activeCalls: phase === 'assigned' ? [{ ...call, status: 'Assigned', assignedAgentId: 'agent-id', assignedAgentName: 'Agent Demo', assignedAtUtc: '2026-07-23T10:00:05Z' }] : [] });
    if (path === '/api/calls' && request.method() === 'POST') { phase = 'waiting'; return json(call); }
    if (path === '/api/calls/call-id/assign') { phase = 'assigned'; return json({ ...call, status: 'Assigned', assignedAgentId: 'agent-id', assignedAgentName: 'Agent Demo', assignedAtUtc: '2026-07-23T10:00:05Z' }); }
    if (path === '/api/agents') return json([{ id: 'agent-id', displayName: 'Agent Demo', status: 'Busy', lastAvailableAtUtc: null, currentCallReference: call.callReferenceNumber }]);
    if (path === '/api/calls/history') return json({ items: [{ ...call, status: 'Assigned', customerName: null, agentName: 'Agent Demo' }], totalCount: 1, page: 1, pageSize: 20, totalPages: 1 });
    if (path === '/api/calls/call-id') return json({ ...call, status: 'Assigned', assignedAgentId: 'agent-id', assignedAgentName: 'Agent Demo', assignedAtUtc: '2026-07-23T10:00:05Z', events: [{ id: 'event-1', eventType: 'Created', eventAtUtc: call.createdAtUtc, details: null }, { id: 'event-2', eventType: 'Assigned', eventAtUtc: '2026-07-23T10:00:05Z', details: 'Assigned to Agent Demo' }] });
    return route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
  });

  await page.goto('/supervisor/dashboard');
  await page.getByRole('radio', { name: 'Unknown caller' }).check();
  await page.getByLabel('Caller phone').fill('+8801712345678');
  await page.getByRole('combobox', { name: 'Active queue' }).click();
  await page.getByRole('option', { name: 'Support' }).click();
  const [createRequest] = await Promise.all([page.waitForRequest((request) => new URL(request.url()).pathname === '/api/calls' && request.method() === 'POST'), page.getByRole('button', { name: 'Create inbound call' }).click()]);
  expect(createRequest.postDataJSON()).toEqual({ customerId: null, callerPhoneNumber: '+8801712345678', callQueueId: 'queue-id' });
  await expect(page.getByText('CALL-2001', { exact: true }).first()).toBeVisible();
  const [assignRequest] = await Promise.all([page.waitForRequest('**/api/calls/call-id/assign'), page.getByRole('button', { name: 'Assign', exact: true }).click()]);
  expect(assignRequest.method()).toBe('POST');
  await expect(page.getByText('Agent Demo', { exact: true }).first()).toBeVisible();

  await page.getByRole('link', { name: 'Call history' }).click();
  await expect(page.getByRole('heading', { name: 'Call history', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'CALL-2001' }).click();
  await expect(page.getByRole('heading', { name: 'Call details', exact: true })).toBeVisible();
  await expect(page.getByText('Assigned to Agent Demo', { exact: true })).toBeVisible();
});
