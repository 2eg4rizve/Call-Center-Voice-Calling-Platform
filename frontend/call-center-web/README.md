# Call Center Web

Angular 20 frontend for the Call Center Voice Calling Platform. It uses standalone components, strict TypeScript, Angular Material, lazy role routes, Vitest, ESLint, and Playwright.

## Requirements and installation

- Node.js 22 LTS and npm 10+
- Google Chrome for Playwright
- Call Center API running on `https://localhost:7105`

```powershell
cd E:\Call-Center-Voice-Calling-Platform\frontend\call-center-web
npm ci
npm start
```

Open `http://localhost:4200`. `npm start` watches source files, so saved changes appear automatically. If `npm` is unavailable, install Node.js 22 LTS or temporarily add the repository-local `.tools\node-v22.23.1-win-x64` directory to `PATH`.

## Configuration and proxy

Both development and production use same-origin `/api` and `/health` paths. During development, `proxy.conf.json` forwards them to `https://localhost:7105`; certificate verification is disabled only for that local development proxy. Production must terminate HTTPS and route these paths to the API at the hosting layer. No API URL, token, password, or customer record is embedded in a production environment file.

## Commands

```text
npm start             Development server with API proxy
npm run build         Strict production build
npm run lint          TypeScript and Angular template lint
npm test              All Vitest tests once
npm run test:watch    Vitest watch mode
npm run test:coverage Coverage report
npm run e2e           Mocked Playwright regression suite
npm run e2e:live      Opt-in live tests selected by @live
```

## Routes and roles

| Route | Role | Purpose |
| --- | --- | --- |
| `/login` | Guest | Secure sign in |
| `/agent/workspace` | Agent | Availability, accept, and complete calls |
| `/agent/history` | Agent | Own call history |
| `/supervisor/dashboard` | Supervisor | Metrics, simulated inbound calls, and assignment |
| `/supervisor/history` | Supervisor | Cross-Agent history and filters |
| `/supervisor/agents` | Supervisor | Agent create, edit, and queue membership |
| `/supervisor/queues` | Supervisor | Queue create, edit, and deactivate |
| `/supervisor/customers` | Supervisor | Customer lookup, create, and update |
| `/calls/:id` | Authenticated | Role-aware call details and event timeline |

Anonymous users are redirected to login with a safe `returnUrl`. Cross-role access goes to `/unauthorized`. Sessions use `sessionStorage`, expire using the API timestamp, and are cleared on logout or `401`.

## Demo accounts

The seeded development API normally provides:

- Supervisor: `supervisor@callcenter.local`
- Agent: `agent1@callcenter.local`
- Password: `Demo@12345`

These are development-only accounts. Do not use them in a deployed environment.

## Main workflows

1. An Agent signs in, selects Available, receives an assigned call, accepts it, then completes it with an outcome and optional notes.
2. A Supervisor monitors dashboard metrics, creates a known-customer or unknown-caller inbound call, and assigns a waiting call to an eligible Agent.
3. Supervisors manage Agents, additive queue membership, active queues, and customer CRM records.
4. Each role reviews permitted call history and opens chronological call details.

Agent current-call state polls every 3 seconds and Supervisor dashboard state every 5 seconds. Polling pauses while the tab is hidden, refreshes immediately when visible, prevents overlapping requests, and stops when the component is destroyed.

## Testing

The default Playwright suite mocks API responses and covers responsive layouts, accessibility, authentication, route protection, Agent and Supervisor workflows, administration, HTTP/error states, and layout stability. Run it without a backend:

```powershell
npm run e2e
```

The live smoke flow changes backend data and is intentionally opt-in. Use only against an isolated seeded environment with one eligible Agent:

```powershell
$env:LIVE_API_SMOKE='1'
$env:LIVE_AGENT_EMAIL='agent1@callcenter.local'
$env:LIVE_SUPERVISOR_EMAIL='supervisor@callcenter.local'
$env:LIVE_PASSWORD='Demo@12345'
$env:LIVE_QUEUE_NAME='Customer Support'
$env:LIVE_CALLER_PHONE='+8801712345678'
npm run e2e:live
```

## Current API limitations

- Queue listing returns active queues only; a deactivated queue cannot be listed or reactivated from this UI.
- Agent queue membership is additive and idempotent; current memberships cannot be reliably listed or removed by the available API.
- Customer phone numbers cannot be updated, and customer responses do not return the stored phone number.
- Polling is used because the API currently has no WebSocket or SignalR event stream.
- Call creation simulates inbound telephony; it does not connect to a real carrier.
