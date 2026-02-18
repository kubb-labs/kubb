# @kubb/agent

Kubb Agent Server — HTTP/HTTPS server for code generation powered by Node.js.

## Features

- 🚀 Fast HTTP server built with Node.js
- 📡 RESTful API endpoints for code generation
- 🔧 Easy integration with Kubb configuration
- 📊 Health and info endpoints
- 🔗 WebSocket integration with Kubb Studio
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
kubb agent start --config kubb.config.ts --host 0.0.0.0 --port 8080
```

### Manual Server Start

If you need to start the server directly:

```bash
KUBB_CONFIG=./kubb.config.ts node packages/agent/.output/server/index.mjs
```

Or if using the built package:

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

## Quick Start

1. **Update `.env`:**
```env
KUBB_STUDIO_URL=http://localhost:3000
KUBB_AGENT_TOKEN=your-token-here
```

2. **Run the agent:**
```bash
pnpm dev
```

3. **Access at:**
```
http://localhost:4000
```


## WebSocket Studio Integration

The agent automatically connects to Kubb Studio on startup:

```env
KUBB_STUDIO_URL=http://localhost:3000
KUBB_AGENT_TOKEN=authentication-token
```

The connection:
- Sends agent information on connect
- Streams generation events in real-time
- Receives generate commands from Studio
- Uses WebSocket for bidirectional communication

## Quick Start Example

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
KUBB_CONFIG=./kubb.config.ts pnpm dev
```

### 3. Trigger generation:

```bash
curl -N http://localhost:4000/api/generate
```

You'll receive a stream of events as the code generation progresses.

## License

MIT
