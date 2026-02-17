# @kubb/agent

Kubb Agent Server — HTTP server for code generation powered by Node.js.

## Features

- 🚀 Fast HTTP server built with Node.js
- 📡 RESTful API endpoints for code generation
- 🔧 Easy integration with Kubb configuration
- 📊 Health and info endpoints
- ⚡ Production-ready

## Installation

```bash
pnpm add -D @kubb/agent
```

## Usage

Start the agent server with your Kubb configuration:

```bash
KUBB_CONFIG=./kubb.config.ts node packages/agent/.output/server/index.mjs
```

Or if using the built package:

```bash
KUBB_CONFIG=./kubb.config.ts node node_modules/@kubb/agent/.output/server/index.mjs
```

The server will be available at `http://localhost:3000` by default.

### Environment Variables

- `KUBB_CONFIG` - **Required**. Path to your Kubb configuration file (e.g., `./kubb.config.ts` or `./kubb.config.js`). Supports both TypeScript and JavaScript files. Can be relative or absolute.
- `PORT` - Server port (default: `3000`)
- `HOST` - Server host (default: `localhost`)

## API Endpoints

### `GET /`
Get server information and available endpoints.

```bash
curl http://localhost:3000/
```

Response:
```json
{
  "name": "Kubb Agent Server",
  "version": "4.23.0",
  "endpoints": {
    "health": "/api/health",
    "info": "/api/info"
  }
}
```

### `GET /api/health`
Check server health status.

```bash
curl http://localhost:3000/api/health
```

Response:
```json
{
  "status": "ok",
  "message": "Kubb Agent Server is running"
}
```

### `GET /api/info`
Get server information.

```bash
curl http://localhost:3000/api/info
```

Response:
```json
{
  "name": "Kubb Agent Server",
  "version": "4.23.0"
}
```

### `POST /api/generate`
Trigger code generation with Server-Sent Events (SSE) streaming.

```bash
curl -N http://localhost:3000/api/generate
```

This endpoint streams generation events back to the client using SSE. The server uses the configuration specified in the `KUBB_CONFIG` environment variable to generate code. Events include:
- `generation:start` - Generation started
- `plugin:start`/`plugin:end` - Plugin lifecycle events  
- `info`, `success`, `warn`, `error` - Status messages
- `format:start`/`format:end` - Formatting lifecycle
- `lint:start`/`lint:end` - Linting lifecycle
- `hooks:start`/`hooks:end` - Post-generation hooks
- `generation:end` - Generation complete
- `generation:summary` - Summary with statistics

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
KUBB_CONFIG=./kubb.config.ts node packages/agent/.output/server/index.mjs
```

### 3. Trigger generation:

```bash
curl -N http://localhost:3000/api/generate
```

You'll receive a stream of events as the code generation progresses.

## Development

Watch mode:

```bash
pnpm start
```

Build:

```bash
pnpm build
```

Test:

```bash
pnpm test
```

Type checking:

```bash
pnpm typecheck
```

Linting:

```bash
pnpm lint
```

## License

MIT
