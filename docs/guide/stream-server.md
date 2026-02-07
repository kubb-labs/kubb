---
layout: doc

title: Stream Server - Real-time Code Generation API
description: Learn how to use Kubb's HTTP stream server for real-time code generation with Server-Sent Events (SSE).
outline: deep
---

# Stream Server

Kubb's stream server provides a real-time HTTP API for code generation using [Server-Sent Events (SSE)](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events).
This enables live progress tracking, event streaming, and integration with external tools like the [Kubb Playground](../playground.md).

## Overview

The stream server exposes three HTTP endpoints:

- **`GET /health`** - Health check and version info
- **`GET /api/info`** - Configuration metadata and OpenAPI spec
- **`POST /api/stream`** - SSE stream for code generation events

## Starting the Server

Use the `--stream` flag with the `kubb generate` command:

```shell
npx kubb generate --stream
```

### Options

#### --stream

Start the HTTP server with SSE streaming.

```shell
npx kubb generate --stream
```

#### --port (-p)

Specify the port for the stream server. If not specified, an available port is automatically selected.

```shell
npx kubb generate --stream --port 3000
```

#### --host

Specify the host for the stream server (default: `localhost`).

```shell
npx kubb generate --stream --host 0.0.0.0 --port 3000
```

### Server Output

When started, the server displays connection information:

```mdx
✔ Stream server started on http://localhost:3000

ℹ Config: kubb.config.ts
ℹ Connect: http://localhost:3000/api/info
ℹ Stream: http://localhost:3000/api/stream
ℹ Health: http://localhost:3000/health

◆ Waiting for requests... (Press Ctrl+C to stop)
```

## API Endpoints

### GET /health

Health check endpoint that returns server status and version information.

**Response:**

```json
{
  "status": "ok",
  "version": "4.21.0",
  "configPath": "kubb.config.ts"
}
```

**Example:**

```shell
curl http://localhost:3000/health
```

### GET /api/info

Returns configuration metadata and the OpenAPI specification content.

**Response:**

```json
{
  "version": "4.21.0",
  "configPath": "kubb.config.ts",
  "spec": "openapi: 3.0.0\n...",
  "config": {
    "name": "my-api",
    "root": ".",
    "input": {
      "path": "./openapi.yaml"
    },
    "output": {
      "path": "./src/gen",
      "write": true,
      "extension": {
        ".ts": ".ts"
      },
      "barrelType": "all"
    },
    "plugins": [
      {
        "name": "@kubb/plugin-oas",
        "options": {}
      },
      {
        "name": "@kubb/plugin-ts",
        "options": {}
      }
    ]
  }
}
```

**Example:**

```shell
curl http://localhost:3000/api/info
```

### POST /api/stream

Starts code generation and streams events via Server-Sent Events (SSE).

**Headers:**

```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

**Event Format:**

Each event follows the SSE format:

```
data: {"type":"<event-type>","data":[...]}\n\n
```

**Example:**

```shell
curl -X POST http://localhost:3000/api/stream
```

## Configuration Limitations

> [!IMPORTANT]
> Stream mode only supports a single configuration. If multiple configs are defined in `kubb.config.ts`, only the first one will be used.

```typescript
export default defineConfig([
  { name: 'config-1', ... }, // ✅ This config will be used
  { name: 'config-2', ... }, // ⚠️ This will be ignored
])
```

If you need multiple configurations, run separate stream server instances with different config files:

```shell
# Terminal 1
npx kubb generate --config kubb.config1.ts --stream --port 3001

# Terminal 2
npx kubb generate --config kubb.config2.ts --stream --port 3002
```

## Debugging

Use the `--debug` flag to see detailed logs:

```shell
npx kubb generate --stream --debug
```

This will show:
- Server startup details
- Request handling logs
- Event emission details
- Error stack traces

## Related

- [Kubb Playground](../playground.md) - Interactive code generation tool
- [CLI Reference](../helpers/cli.md) - Complete CLI documentation
- [Debugging Guide](./debugging.md) - Troubleshooting tips
