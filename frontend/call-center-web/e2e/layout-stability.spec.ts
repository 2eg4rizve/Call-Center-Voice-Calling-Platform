import { expect, Page, test } from '@playwright/test';

declare global {
  interface Window { __layoutShiftScore?: number }
}

async function prepareDashboard(page: Page): Promise<void> {
  await page.addInitScript(() => {
    sessionStorage.setItem('call-center.session', JSON.stringify({
      accessToken: 'layout-test-token', expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
      userId: 'supervisor-id', displayName: 'Supervisor Demo', email: 'supervisor@example.com',
      role: 'Supervisor', agentId: null,
    }));
    window.__layoutShiftScore = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const shift = entry as PerformanceEntry & { hadRecentInput: boolean; value: number };
        if (!shift.hadRecentInput) window.__layoutShiftScore! += shift.value;
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });

  await page.route('**/api/call-queues', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await page.route('**/api/dashboard/**', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 350));
    const path = new URL(route.request().url()).pathname;
    const body = path.endsWith('/metrics')
      ? { totalAgents: 2, availableAgents: 1, busyAgents: 1, onBreakAgents: 0, offlineAgents: 0, waitingCalls: 0, assignedCalls: 0, activeCalls: 0, completedCallsToday: 3, averageCompletedCallDurationSeconds: 90 }
      : path.endsWith('/agents') ? { agents: [] } : { waitingCalls: [], activeCalls: [] };
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });
}

for (const viewport of [{ width: 360, height: 800 }, { width: 768, height: 1024 }, { width: 1440, height: 900 }]) {
  test(`dashboard loading transition is stable at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await prepareDashboard(page);
    await page.goto('/supervisor/dashboard');
    await expect(page.getByRole('heading', { name: 'Loading operations' })).toBeVisible();
    await expect(page.getByLabel('Operational metrics')).toBeVisible();
    await page.waitForTimeout(100);

    const cumulativeLayoutShift = await page.evaluate(() => window.__layoutShiftScore ?? 0);
    expect(cumulativeLayoutShift).toBeLessThanOrEqual(0.1);
  });
}
