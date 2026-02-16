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

Start the agent server:

```bash
kubb agent start
```

The server will be available at `http://localhost:8080` by default.

### Environment Variables

- `PORT` - Server port (default: `8080`)
- `HOST` - Server host (default: `localhost`)

## API Endpoints

### `GET /`
Get server information and available endpoints.

```bash
curl http://localhost:8080/
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
curl http://localhost:8080/api/health
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
curl http://localhost:8080/api/info
```

Response:
```json
{
  "name": "Kubb Agent Server",
  "version": "4.23.0"
}
```

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
