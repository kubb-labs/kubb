# @kubb/agent

Kubb Agent Server — HTTP server for code generation powered by Node.js.

## Features

- 🚀 Fast HTTP server built with Node.js
- 📡 RESTful API endpoints for code generation
- 🔧 Easy integration with Kubb configuration
- 📊 Health and info endpoints
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

The server will be available at `http://localhost:3000` by default.

### Environment Variables

- `KUBB_CONFIG` - **Required**. Path to your Kubb configuration file (e.g., `./kubb.config.ts` or `./kubb.config.js`). Supports both TypeScript and JavaScript files. Can be relative or absolute.
- `PORT` - Server port (default: `3000`)
- `HOST` - Server host (default: `localhost`)


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

## License

MIT
