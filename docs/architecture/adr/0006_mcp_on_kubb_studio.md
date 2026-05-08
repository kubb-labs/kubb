# Plan 2: Host MCP on kubb.studio

## Context

`kubb-labs/platform` is a **Nuxt + Nitro** app running at `kubb.studio`. It already communicates with `@kubb/agent` instances over **WebSocket**, where each session has a UUID. The MCP endpoint should be scoped per agent session at:

```
mcp.kubb.studio/agent/{uuid}/mcp
```

This mirrors the existing WebSocket session model (`kubb.studio/agent/{uuid}`) and keeps one uniform call convention — both the agent API and MCP tools accept the same kubb config structure.

---

## Prerequisites

Plan 1 (tmcp migration) must be complete first because it exports `createMcpServer()` from `@kubb/mcp`.

---

## Architecture

```
AI assistant (Claude, Cursor, etc.)
    │
    │  JSON-RPC over SSE
    ▼
mcp.kubb.studio/agent/{uuid}/mcp    ← Nitro route in kubb-labs/platform
    │
    │  createMcpServer({ agentId: uuid })
    ▼
@kubb/mcp  (generate / validate / init tools)
    │
    │  WebSocket  (same connection the platform already manages)
    ▼
@kubb/agent  (running agent instance for this session)
```

---

## Changes in `kubb-labs/platform`

### 1. Install dependencies

```json
// package.json
"@kubb/mcp": "latest",
"@tmcp/transport-http": "^0.8.5"
```

### 2. Add Nitro route `server/routes/agent/[uuid]/mcp.ts`

H3 (Nitro's router) exposes `toWebRequest(event)` which produces a standard Fetch `Request` and supports returning a Fetch `Response` directly — exactly what `HttpTransport.respond()` needs.

```typescript
// server/routes/agent/[uuid]/mcp.ts
import { createMcpServer } from '@kubb/mcp'
import { HttpTransport } from '@tmcp/transport-http'

// One transport per agent UUID — keyed map, entries cleaned up when session ends
const transports = new Map<string, HttpTransport>()

function getTransport(uuid: string): HttpTransport {
  if (!transports.has(uuid)) {
    const server = createMcpServer({ agentId: uuid })
    transports.set(uuid, new HttpTransport(server))
  }
  return transports.get(uuid)!
}

// Handles all methods: GET (SSE stream), POST (tool calls), DELETE (session cleanup)
export default defineEventHandler(async (event) => {
  const uuid = getRouterParam(event, 'uuid')!
  const transport = getTransport(uuid)
  const request = toWebRequest(event)
  const response = await transport.respond(request)
  return response ?? new Response('Not Found', { status: 404 })
})
```

### 3. Session cleanup

When the agent WebSocket session ends (existing platform lifecycle event), remove the transport entry:

```typescript
// wherever the platform tears down an agent session:
transports.delete(uuid)
```

This prevents memory leaks from accumulating transport instances.

### 4. DNS / reverse proxy

Add a `mcp.kubb.studio` subdomain (or reuse the same domain with path routing) pointing to the Nitro server. The Nitro `routeRules` can handle CORS:

```typescript
// nitro.config.ts (or nuxt.config.ts routeRules)
'/agent/*/mcp': {
  cors: true,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, mcp-session-id',
  },
}
```

---

## How AI clients connect

**Claude Desktop / Cursor (HTTP transport):**
```json
{
  "mcpServers": {
    "kubb": {
      "url": "https://mcp.kubb.studio/agent/YOUR-UUID/mcp"
    }
  }
}
```

**Local stdio (unchanged):**
```json
{
  "mcpServers": {
    "kubb": {
      "command": "npx",
      "args": ["kubb", "mcp"]
    }
  }
}
```

---

## Uniform calling convention

Both the WebSocket agent API and the MCP tools share the same kubb config format. The MCP `generate` tool accepts `config` (path to `kubb.config.ts`), the same field the agent already understands. No parallel config formats.

| Interface           | URL                                       | Protocol              |
|---------------------|-------------------------------------------|-----------------------|
| MCP per session     | `mcp.kubb.studio/agent/{uuid}/mcp`        | JSON-RPC over SSE     |
| Agent (WebSocket)   | `kubb.studio/agent/{uuid}`                | WebSocket             |
| Local stdio MCP     | `kubb mcp`                                | stdio                 |
| Local HTTP MCP      | `kubb mcp --port 3001`                    | JSON-RPC over SSE     |

---

## Open questions before implementation

1. **Does the platform have a `toWebRequest` import available?** It's a built-in H3 utility, should be available from `h3` or `nitropack/runtime`.
2. **Where is the agent session lifecycle managed?** Need the exact hook/event to clean up the transport map on session end.
3. **Subdomain vs path routing?** `mcp.kubb.studio` requires DNS config; `/mcp/agent/{uuid}` is simpler but changes the URL.
4. **Auth?** Should the `/mcp` endpoint require the same token as the agent WebSocket, or be open? `@tmcp/transport-http` has optional OAuth support via `@tmcp/auth`.
