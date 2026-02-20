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

The server will be available at `http://localhost:4000`.

### Environment Variables

- `KUBB_CONFIG` - **Required**. Path to your Kubb configuration file (e.g., `./kubb.config.ts` or `./kubb.config.js`). Supports both TypeScript and JavaScript files. Can be relative or absolute.
- `PORT` - Server port (default: `4000`)
- `HOST` - Server host (default: `localhost`)
- `KUBB_STUDIO_URL` - Studio connection URL (e.g., `http://localhost:3000`)
- `KUBB_AGENT_TOKEN` - Authentication token for Studio connection
- `KUBB_AGENT_NO_CACHE` - Disable session caching (set to `true` to skip cache)
- `KUBB_ALLOW_WRITE` - Allow writing generated files to the filesystem (set to `true` to enable). When `false` (default), no files are written and the config patch is not persisted.
- `KUBB_ALLOW_ALL` - Grant all permissions including filesystem writes. Implies `KUBB_ALLOW_WRITE=true`.

### Automatic .env Loading

The agent automatically loads environment variables from:
1. `.env` - Base environment variables
2. `.env.local` - Local overrides (for secrets/local config)

Files are optional and loaded in order, with `.env.local` taking precedence.

## Quick Start

1. **Create `.env` file:**
```env
PORT=4000
KUBB_ROOT=/Users/stijnvanhulle/GitHub/kubb/examples/react-query/
KUBB_CONFIG=/Users/stijnvanhulle/GitHub/kubb/examples/react-query/kubb.config.ts
KUBB_AGENT_TOKEN=
KUBB_AGENT_NO_CACHE=true
KUBB_STUDIO_URL=https://studio.kubb,dev
```

2. **Run the agent:**
```bash
npx kubb agent start
```

3. **Agent is now available at:**
```
http://localhost:4000
```

## WebSocket Studio Integration

The agent automatically connects to Kubb Studio on startup:

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

**Connected**
```json
{
  "type": "connected",
  "id": "unique-id",
  "payload": {
    "version": "4.24.0",
    "config": { /* full kubb config */ },
    "spec": "/* OpenAPI spec */"
  }
}
```

**Data Events (during generation)**
```json
{
  "type": "data",
  "id": "message-id",
  "event": "plugin:start",
  "payload": "{...}"
}
```

**Ping (every 30 seconds)**
```json
{
  "type": "ping"
}
```

### Messages Received from Studio

**Generate Command**
```json
{
  "type": "command",
  "command": "generate"
}
```

**Connect Command (resend info)**
```json
{
  "type": "command",
  "command": "connect"
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
