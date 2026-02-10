# Kubb Stream Server API

This directory contains the OpenAPI specification for the Kubb Stream Server API.

## OpenAPI Specification

The API is documented in `openapi.yaml` using OpenAPI 3.1.0.

## API Overview

The Kubb Stream Server provides three main endpoints:

- **`GET /api/health`** - Health check and version info
- **`GET /api/info`** - Configuration metadata and OpenAPI spec content
- **`POST /api/generate`** - SSE stream for code generation events

## Starting the Server

```bash
npx kubb start
```

## Using the API

### Health Check

```bash
curl http://localhost:3000/api/health
```

### Get Configuration Info

```bash
curl http://localhost:3000/api/info
```

### Generate Code (SSE Stream)

```bash
curl -X POST http://localhost:3000/api/generate
```

## Generating API Clients

You can use this OpenAPI spec to generate clients for the stream server:

```bash
# Using Kubb itself
npx kubb generate --config kubb-stream-api.config.ts

# Or with other tools like OpenAPI Generator
openapi-generator-cli generate -i openapi.yaml -g typescript-fetch -o ./client
```

## Event Types

The `/api/generate` endpoint streams Server-Sent Events with the following event types:

- `generation:start` - Code generation started
- `plugin:start` - Plugin execution started
- `plugin:end` - Plugin execution completed
- `files:processing:start` - File processing started
- `file:processing:update` - File processing progress update
- `files:processing:end` - File processing completed
- `generation:end` - Code generation completed
- `lifecycle:end` - Full lifecycle completed
- `info` - Informational message
- `success` - Success message
- `warn` - Warning message
- `error` - Error occurred

## Learn More

- [Stream Server Guide](../../docs/guide/stream-server.md)
- [CLI Documentation](../../docs/helpers/cli.md)
