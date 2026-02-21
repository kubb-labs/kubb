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
KUBB_CONFIG=./kubb.config.ts node node_modules/@kubb/agent/.output/server/index.mjs
```

The server will be available at `http://localhost:3000`.

### Docker

Run the agent standalone, mounting your config file into the container:

```bash
docker run --env-file .env \
  -p 3000:3000 \
  -v ./kubb.config.ts:/kubb/agent/kubb.config.ts \
  kubblabs/kubb-agent
```

### Docker Compose

To run the full stack (Studio + Agent + Postgres), use the provided `docker-compose.yml`:

```yaml
services:
  agent:
    image: kubblabs/kubb-agent:latest
    ports:
      - "3001:3000"
    env_file:
      - .env
    environment:
      PORT: 3000
      KUBB_ROOT: /kubb/agent
      KUBB_CONFIG: kubb.config.ts
      KUBB_STUDIO_URL: http://kubb-studio:3000
    volumes:
      - ./kubb.config.ts:/kubb/agent/kubb.config.ts
    depends_on:
      studio:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://localhost:3000/api/health || exit 1"]
      interval: 30s
      timeout: 5s
      start_period: 10s
      retries: 3
```

```bash
docker compose up
```

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `KUBB_CONFIG` | `kubb.config.ts` | Path to your Kubb config file. Relative paths are resolved against `KUBB_ROOT`. |
| `KUBB_ROOT` | `/kubb/agent` (Docker) / `cwd` | Root directory for resolving relative paths. |
| `PORT` | `3000` | Server port. |
| `HOST` | `0.0.0.0` | Server host. |
| `KUBB_STUDIO_URL` | `https://studio.kubb.dev` | Kubb Studio WebSocket URL. |
| `KUBB_AGENT_TOKEN` | _(empty)_ | Authentication token for Studio. Required to connect. |
| `KUBB_AGENT_NO_CACHE` | `false` | Set to `true` to disable session caching. |
| `KUBB_ALLOW_WRITE` | `false` | Set to `true` to allow writing generated files to disk. |
| `KUBB_ALLOW_ALL` | `false` | Set to `true` to grant all permissions (implies `KUBB_ALLOW_WRITE=true`). |
| `KUBB_RETRY_TIMEOUT` | `30000` | Milliseconds to wait before retrying a failed Studio connection. |

### Automatic .env Loading

The agent automatically loads a `.env` file from the current working directory into `process.env` on startup. Variables already set in the environment take precedence.

## Quick Start

1. **Create `.env` file:**
```env
PORT=3000
KUBB_ROOT=/path/to/your/project
KUBB_CONFIG=/path/to/your/project/kubb.config.ts
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

### Connection Features

- **Automatic reconnection**: Caches session tokens to speed up reconnects
- **Real-time events**: Streams generation progress and events
- **Command handling**: Receives `generate` and `connect` commands from Studio
- **Graceful shutdown**: Notifies Studio when disconnecting
- **Session management**: 24-hour session expiration with auto-refresh

### Session Caching

Sessions are cached in `~/.kubb/config.json` for faster reconnects:
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
`payload` is optional. When omitted, the agent uses the config loaded from disk.

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

## License

MIT
