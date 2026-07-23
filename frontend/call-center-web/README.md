# Call Center Web

Angular 20 frontend for the Call Center Voice Calling Platform. The application uses standalone components, strict TypeScript, Angular Material, lazy routes, Vitest, ESLint, and Playwright.

## Prerequisites

- Node.js 22 LTS
- npm 10+
- Google Chrome (for local Playwright smoke tests)
- Backend API running at `https://localhost:7105`

## Local setup

```bash
npm ci
npm start
```

Open `http://localhost:4200`. Development requests to `/api` and `/health` are proxied to the HTTPS backend through `proxy.conf.json`. Local development certificate verification is disabled only at the development proxy layer.

## Commands

```bash
npm start          # development server with API proxy
npm run build      # strict production build
npm run lint       # TypeScript and Angular template linting
npm test           # Vitest unit tests once
npm run test:watch # Vitest watch mode
npm run test:coverage
npm run e2e        # mocked/local Playwright suite
npm run e2e:live   # tests tagged with @live
```

Production configuration uses same-origin `/api` and `/health` paths and contains no local backend URL or secrets.
