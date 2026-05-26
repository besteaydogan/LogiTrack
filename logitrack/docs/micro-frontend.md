# Micro-Frontend Architecture

LogiTrack uses Vite Module Federation to keep the shell responsible for global layout and app-level providers while domain screens are delivered by runtime remotes.

## Route Ownership

| Route | Owner | Mode |
|---|---|---|
| `/` | Shell | Local dashboard route |
| `/dashboard` | Shell | Local dashboard route |
| `/deliveries` | Delivery Management remote | Federated route |
| `/alerts` | Alert Center remote | Federated route |
| `/analytics` | Analytics remote | Federated route |
| `/fleet` | Fleet Dashboard remote | Federated route |
| `/fleet/vehicles/:id` | Fleet Dashboard remote | Federated route |

## Provider Rule

The shell owns the global `QueryClientProvider` when remotes are rendered inside the shell. Federated page exports must not create their own query client. Standalone remote entrypoints may create a local `QueryClientProvider` only for isolated development and preview.

## Shared Packages

- `@logitrack/types` owns shared entity and API response types.
- `@logitrack/api-client` owns API base URL configuration, fetch wrappers, query keys, REST helpers, and SSE helpers.
- `@logitrack/ui` owns reusable UI primitives such as Button, Card, Badge, Table, PageHeader, EmptyState, StateMessage, LazyPage, and RemoteErrorFallback.

Business logic stays in the owning app. Shared UI should not contain logistics-specific API calls, query logic, or domain calculations.

## Local Ports

| App | URL |
|---|---|
| Shell host | `http://localhost:5173` |
| Analytics remote | `http://localhost:5174` |
| Fleet Dashboard remote | `http://localhost:5175` |
| Delivery Management remote | `http://localhost:5176` |
| Alert Center remote | `http://localhost:5177` |

## Commands

```bash
pnpm dev
pnpm dev:standalone
pnpm dev:shell
pnpm dev:analytics
pnpm dev:fleet
pnpm dev:delivery
pnpm dev:alerts
```

Use `pnpm dev` for integrated shell plus remotes verification. It runs `pnpm build` and then `pnpm preview`, which serves the built federation `remoteEntry.js` files from `/assets/remoteEntry.js`.

Use `pnpm dev:standalone` for isolated remote development. Standalone Vite dev mode is useful while working inside one app, but it should not be used as proof that the shell can import runtime remotes.

```bash
pnpm build
pnpm preview:shell
pnpm preview:analytics
pnpm preview:fleet
pnpm preview:delivery
pnpm preview:alerts
```

## Failure Behavior

Each remote route is wrapped by the shell remote boundary. If a remote is unavailable, only that route should show a readable fallback. The shell layout and other routes should continue working.
