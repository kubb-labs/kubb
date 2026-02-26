<p align="center">
  <img src="https://raw.githubusercontent.com/kubb-labs/kubb/main/assets/logo.png" alt="Kubb logo" width="200" />
</p>

# @kubb/agent

Kubb Agent Server — HTTP server for code generation powered by [Nitro](https://nitro.build) with WebSocket integration for real-time Studio communication.

## Features

- 🚀 Fast HTTP server built with [Nitro](https://nitro.build)
- 📡 RESTful API endpoints for code generation
- 🔧 Easy integration with Kubb configuration
- 📊 Health and info endpoints
- 🔗 Bidirectional WebSocket with Kubb Studio
- 🖥️ Machine binding — token locked to the registered machine via stable `machineToken`
- 💾 Automatic session caching for faster reconnects
- ⚡ Production-ready

## Installation

The agent server is installed as part of `@kubb/cli`:

```bash
pnpm add -D @kubb/cli
```

## Usage

### Via CLI (Recommended)

Start the agent server using the Kubb CLI:

```bash
kubb agent start --config kubb.config.ts
```

With custom options:

```bash
kubb agent start --config kubb.config.ts --host 0.0.0.0 --port 8080 --no-cache
```

### Manual Server Start

If you need to start the server directly:

```bash
KUBB_AGENT_CONFIG=./kubb.config.ts node node_modules/@kubb/agent/.output/server/index.mjs
```

The server will be available at `http://localhost:3000`.

### Docker

Run the agent standalone:

```bash
docker run --env-file .env \
  -p 3000:3000 \
  kubblabs/kubb-agent
```

A default `kubb.config.ts` is baked into the image at `/kubb/agent/data/kubb.config.ts`. To use your own config, bind-mount it over the default:

```bash
docker run --env-file .env \
  -p 3000:3000 \
  -v ./kubb.config.ts:/kubb/agent/data/kubb.config.ts \
  kubblabs/kubb-agent
```

### Docker Compose

Use the provided `docker-compose.yaml` in `packages/agent`:

```yaml
services:
  agent:
    image: kubblabs/kubb-agent:latest
    container_name: kubb-agent
    environment:
      PORT: 80
      KUBB_AGENT_ROOT: /kubb/agent/data
      KUBB_AGENT_CONFIG: ./kubb.config.ts
      KUBB_STUDIO_URL: https://studio.kubb.dev
    volumes:
      - agent_kv:/kubb/agent/.kubb/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "-e", "fetch('http://localhost:3000/api/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"]
      interval: 15s
      timeout: 10s
      start_period: 60s
      retries: 5

volumes:
  agent_kv:
```

```bash
docker compose up
```

The `agent_kv` named volume persists the KV store (session cache, machine token) across container restarts and upgrades.

### Environment Variables

| Variable                     | Default | Description |
|------------------------------|---|---|
| `KUBB_AGENT_CONFIG`          | `kubb.config.ts` | Path to your Kubb config file. Relative paths are resolved against `KUBB_AGENT_ROOT`. |
| `KUBB_AGENT_ROOT`            | `/kubb/agent` (Docker) / `cwd` | Root directory for resolving relative paths. |
| `PORT`                       | `3000` | Server port. |
| `HOST`                       | `0.0.0.0` | Server host. |
| `KUBB_STUDIO_URL`            | `https://studio.kubb.dev` | Kubb Studio WebSocket URL. |
| `KUBB_AGENT_TOKEN`           | _(empty)_ | Authentication token for Studio. Required to connect. |
| `KUBB_AGENT_NO_CACHE`        | `false` | Set to `true` to disable session caching. |
| `KUBB_AGENT_ALLOW_WRITE`     | `false` | Set to `true` to allow writing generated files to disk. |
| `KUBB_AGENT_ALLOW_ALL`       | `false` | Set to `true` to grant all permissions (implies `KUBB_AGENT_ALLOW_WRITE=true`). |
| `KUBB_AGENT_RETRY_TIMEOUT`   | `30000` | Milliseconds to wait before retrying a failed Studio connection. |

### Automatic .env Loading

The agent automatically loads a `.env` file from the current working directory into `process.env` on startup. Variables already set in the environment take precedence.

## Quick Start

1. **Create `.env` file:**
```env
PORT=3000
KUBB_AGENT_ROOT=/path/to/your/project
KUBB_AGENT_CONFIG=/path/to/your/project/kubb.config.ts
KUBB_AGENT_TOKEN=your-token-here
KUBB_AGENT_NO_CACHE=false
KUBB_STUDIO_URL=https://studio.kubb.dev
```

2. **Run the agent:**
```bash
npx kubb agent start
```

3. **Agent is now available at:**
```
http://localhost:3000
```

## WebSocket Studio Integration

The agent connects to Kubb Studio on startup when `KUBB_AGENT_TOKEN` is set.

### Startup Sequence

On startup the agent performs these steps before opening a WebSocket:

1. **Register** — calls `POST /api/agent/register` with a stable `machineToken` derived from the machine's network interfaces and hostname (SHA-256). This binds the token to the machine. Registration failure is non-fatal — a warning is logged and the agent continues.
2. **Create session** — calls `POST /api/agent/session/create` (includes `machineToken` for verification) and receives a WebSocket URL.
3. **Connect** — opens a WebSocket to the returned URL using the `Authorization` header for authentication.

### Connection Features

- **Automatic reconnection**: Caches session tokens to speed up reconnects
- **Real-time events**: Streams generation progress and events
- **Command handling**: Receives `generate` and `connect` commands from Studio
- **Graceful shutdown**: Notifies Studio when disconnecting
- **Session management**: 24-hour session expiration with auto-refresh; Studio re-validates session validity on every incoming agent message and disconnects immediately if revoked or expired

### Session Caching

Sessions are cached in `./.kubb/data` (relative to the working directory, or `agent_kv` volume in Docker) for faster reconnects:
- Tokens are hashed (non-reversible) for security
- Sessions auto-expire after 24 hours
- Use `--no-cache` flag to disable caching
- Invalid sessions are automatically cleaned up

## WebSocket API

### Messages Sent by Agent

**Connected** — sent in response to a `connect` command
```json
{
  "type": "connected",
  "payload": {
    "version": "x.x.x",
    "configPath": "/app/kubb.config.ts",
    "permissions": {
      "allowAll": false,
      "allowWrite": false
    },
    "config": {
      "plugins": [
        { "name": "@kubb/plugin-ts", "options": {} }
      ]
    }
  }
}
```

**Data Events** — streamed during code generation
```json
{
  "type": "data",
  "payload": {
    "type": "plugin:start",
    "data": [{ "name": "plugin-ts" }],
    "timestamp": 1708000000000
  }
}
```

Available `payload.type` values: `plugin:start`, `plugin:end`, `files:processing:start`, `file:processing:update`, `files:processing:end`, `generation:start`, `generation:end`, `info`, `success`, `warn`, `error`.

**Ping** — sent every 30 seconds to keep the connection alive
```json
{ "type": "ping" }
```

### Messages Received from Studio

**Generate Command** — triggers code generation
```json
{
  "type": "command",
  "command": "generate",
  "payload": { "plugins": [] }
}
```
`payload` is optional. When omitted, the agent falls back to `kubb.config.studio.json` (a temporal config file next to `kubb.config.ts`), and then to the config loaded from disk.

The `payload` may also include an `input` field containing a raw OpenAPI / Swagger spec (YAML or JSON string). **This field is only honoured in sandbox mode** — outside of sandbox it is silently ignored for security reasons. See [Sandbox Mode](#sandbox-mode) below.

**Connect Command** — requests agent info
```json
{
  "type": "command",
  "command": "connect",
  "permissions": {
    "allowAll": false,
    "allowWrite": false
  }
}
```

**Pong** — sent by Studio in response to an agent ping
```json
{ "type": "pong" }
```

**Status** — sent by Studio with information about connected agents
```json
{
  "type": "status",
  "message": "...",
  "connectedAgents": 1,
  "agents": [
    { "name": "...", "connectedAt": "..." }
  ]
}
```

## Sandbox Mode

When Kubb Studio provisions a session for the **Sandbox Agent** (the shared agent hosted by Studio itself), it sets `isSandbox: true` in the session response. In sandbox mode the agent behaves differently from a user-owned agent:

| Behaviour | Normal agent | Sandbox agent |
|---|---|---|
| Write generated files to disk | ✅ (when `KUBB_AGENT_ALLOW_WRITE=true`) | ❌ Never |
| Read `input.path` from disk | ✅ | ✅ (falls back when no inline input supplied) |
| Accept inline `input` in generate payload | ❌ Ignored | ✅ |

### Why no filesystem writes?

The sandbox agent runs in a shared, docker environment inside Kubb Studio. Allowing arbitrary disk writes would create security and isolation problems. Instead, `output.write` is always set to `false`, and the generated files are returned to Studio via the WebSocket `generation:end` event where the UI renders them.

### Inline `input` in sandbox mode

Because the sandbox agent cannot read arbitrary files from disk, callers must supply the OpenAPI / Swagger spec content inline via the `input` field in the generate command payload:

```json
{
  "type": "command",
  "command": "generate",
  "payload": {
    "input": "openapi: 3.0.0\ninfo:\n  title: Pet Store\n  version: 1.0.0\n...",
    "plugins": [
      { "name": "@kubb/plugin-ts", "options": {} }
    ]
  }
}
```

The `input` value is treated as `InputData` (i.e. `{ data: "<content>" }`) and overrides the `input` from the loaded config for that generation cycle.  **Outside of sandbox mode this field is ignored.**

## Configuration Example

### 1. Create a Kubb configuration file (`kubb.config.ts`):

```typescript
import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginTs } from '@kubb/plugin-ts'

export default defineConfig({
  input: {
    path: './openapi.json',
  },
  output: {
    path: './src/generated',
  },
  plugins: [
    pluginOas(),
    pluginTs(),
  ],
})
```

### 2. Start the agent server:

```bash
npx kubb agent start
```

You'll receive a stream of events as the code generation progresses.
