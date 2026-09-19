# Production Deployment Guide

ServiceAgent is configured for Cloud Run, Docker containers, and standard Node.js server environments.

## Build Process

ServiceAgent uses a single-command production compilation:

```bash
npm run build
```

This performs two operations:
1. `vite build`: Compiles the React 19 frontend into static assets in `dist/`.
2. `esbuild server.ts`: Bundles the backend Express server into a standalone CommonJS file at `dist/server.cjs`.

## Execution

In production, the app starts with:

```bash
node dist/server.cjs
```

- Express serves all API routes under `/api/*`.
- Express serves static production assets from `dist/` and falls back to `dist/index.html` for single-page routing.
- The server binds strictly to `0.0.0.0:3000` to comply with cloud container routing ingress rules.

## Health Check Endpoint

Monitoring systems can ping:
```http
GET /api/health
```
Response:
```json
{ "status": "ok", "timestamp": "2026-09-18T07:30:00.000Z" }
```
