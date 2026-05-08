# Plan 1: Migrate @kubb/mcp to tmcp

## Why

`@modelcontextprotocol/sdk` is complex and not typesafe — tools must receive `.shape` from Zod objects and callbacks are untyped. `tmcp` (v1.19.3, MIT core) gives full TypeScript inference from Zod schemas and a cleaner, modular API.

> **License note**: The `@tmcp/*` sub-packages currently show "Proprietary" in npm metadata. Worth confirming with the author before shipping to production. Could be a metadata oversight.

---

## Verified API (from installed types)

```typescript
import { McpServer } from 'tmcp'
import { ZodJsonSchemaAdapter } from '@tmcp/adapter-zod'
import { StdioTransport } from '@tmcp/transport-stdio'
import { HttpTransport } from '@tmcp/transport-http'
import { defineTool } from 'tmcp/tool'
import { tool } from 'tmcp/utils'

const server = new McpServer(
  { name: 'Kubb', version: '...' },
  { adapter: new ZodJsonSchemaAdapter() }
)

const myTool = defineTool(
  { name: 'generate', description: '...', schema: z.object({ config: z.string().optional() }) },
  async (input) => tool.text('result')   // or tool.error('message') for errors
)

server.tools([myTool])

// Stdio
new StdioTransport(server).listen()

// HTTP — respond() takes a Fetch API Request, returns Fetch API Response | null
const http = new HttpTransport(server)
const response = await http.respond(request)
```

---

## Tools to add (matching CLI commands)

| MCP Tool   | CLI equivalent    | Params                                           |
|------------|-------------------|--------------------------------------------------|
| `generate` | `kubb generate`   | `config?`, `input?`, `output?`, `logLevel?`      |
| `validate` | `kubb validate`   | `input` (required — path or URL)                 |
| `init`     | `kubb init`       | `input?`, `output?`, `plugins?`                  |

---

## Files to change in `packages/mcp`

### `package.json`
- Remove: `@modelcontextprotocol/sdk`
- Add: `tmcp`, `@tmcp/adapter-zod`, `@tmcp/transport-stdio`, `@tmcp/transport-http`
- Add optional peer: `@kubb/adapter-oas` (needed by `validate` tool — throws descriptive error if missing)
- Bump `size-limit` from 510 KiB → 600 KiB (four packages instead of one)

### `src/schemas/generateSchema.ts` — no change
Already a plain Zod object, compatible with `ZodJsonSchemaAdapter`.

### `src/schemas/validateSchema.ts` — new
```typescript
export const validateSchema = z.object({
  input: z.string().describe('Path or URL to the OpenAPI/Swagger specification'),
})
```

### `src/schemas/initSchema.ts` — new
```typescript
export const initSchema = z.object({
  input: z.string().optional().describe('Path to OpenAPI spec (default: ./openapi.yaml)'),
  output: z.string().optional().describe('Output directory (default: ./src/gen)'),
  plugins: z.string().optional().describe('Comma-separated: plugin-ts,plugin-zod,...'),
})
```

### `src/tools/generate.ts` — refactor
- Remove `CallToolResult` import from `@modelcontextprotocol/sdk`
- Remove `NotificationHandler` interface and param — progress messages are buffered into `messages[]` (already happens today) and included in the final text result
- Change return: `return { content: [...], isError }` → `tool.text(...)` / `tool.error(...)`
- All existing build logic (hooks, `loadUserConfig`, `resolveUserConfig`, `createKubb`, `safeBuild`) stays untouched
- Export a `generateTool` constant via `defineTool`

### `src/tools/validate.ts` — new
```typescript
export const validateTool = defineTool(
  { name: 'validate', description: '...', schema: validateSchema },
  async ({ input }) => {
    let mod: typeof import('@kubb/adapter-oas')
    try { mod = await import('@kubb/adapter-oas') }
    catch {
      return tool.error(
        'The validate tool requires @kubb/adapter-oas.\n' +
        'Install: npm install @kubb/adapter-oas'
      )
    }
    try {
      await mod.adapterOas().validate!(input, { throwOnError: true })
      return tool.text(`Validation successful: ${input}`)
    } catch (err) {
      return tool.error(`Validation failed:\n${err instanceof Error ? err.message : err}`)
    }
  }
)
```

### `src/tools/init.ts` — new (non-interactive)
Duplicate `generateConfigFile()` + `availablePlugins` from `packages/cli/src/runners/init.ts` (pure data, no clack). Write `kubb.config.ts` to disk. Do **not** install packages — return the list of packages to install as part of the output text.

```typescript
export const initTool = defineTool(
  { name: 'init', description: '...', schema: initSchema },
  async ({ input = './openapi.yaml', output = './src/gen', plugins }) => {
    const selected = resolvePlugins(plugins)
    const content = generateConfigFile(selected, input, output)
    const dest = path.join(process.cwd(), 'kubb.config.ts')
    fs.writeFileSync(dest, content, 'utf-8')
    return tool.text(
      `Created kubb.config.ts\n\nInstall packages:\n  npm install kubb ${selected.map(p => p.packageName).join(' ')}\n\nThen: npx kubb generate`
    )
  }
)
```

### `src/tools/index.ts` — new barrel
```typescript
export { generateTool } from './generate.ts'
export { validateTool } from './validate.ts'
export { initTool } from './init.ts'
```

### `src/server.ts` — rewrite
```typescript
export type ServerOptions = { port?: number; host?: string }

export function createMcpServer(options?: { agentId?: string }): McpServer {
  const server = new McpServer(
    { name: 'Kubb', version },
    { adapter: new ZodJsonSchemaAdapter() }
  )
  server.tools([generateTool, validateTool, initTool])
  return server
}

export async function startServer({ port, host = 'localhost' }: ServerOptions = {}) {
  const server = createMcpServer()
  if (port !== undefined) {
    const transport = new HttpTransport(server)
    // Node.js HTTP bridge: IncomingMessage → Fetch Request → Fetch Response → ServerResponse
    const httpServer = http.createServer(async (req, res) => {
      const chunks: Buffer[] = []
      for await (const chunk of req) chunks.push(chunk)
      const fetchReq = new Request(
        `http://${req.headers.host ?? `${host}:${port}`}${req.url}`,
        { method: req.method, headers: req.headers as HeadersInit, body: chunks.length ? Buffer.concat(chunks) : undefined }
      )
      const fetchRes = await transport.respond(fetchReq)
      if (!fetchRes) { res.writeHead(404); res.end('Not Found'); return }
      res.writeHead(fetchRes.status, Object.fromEntries(fetchRes.headers))
      if (fetchRes.body) {
        const reader = fetchRes.body.getReader()
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          res.write(value)
        }
      }
      res.end()
    })
    httpServer.listen(port, host, () =>
      console.log(`Kubb MCP server on http://${host}:${port}`)
    )
  } else {
    new StdioTransport(server).listen()
  }
}
```

Note: Streaming the body chunk-by-chunk is important for SSE (GET /mcp keeps a long-lived connection open).

### `src/index.ts` — update
Export `createMcpServer` and `ServerOptions` for platform integration. Accept `options` in `run()`.

```typescript
export { createMcpServer } from './server.ts'
export type { ServerOptions } from './server.ts'

export async function run(_argv?: string[], options?: ServerOptions): Promise<void> {
  await startServer(options)
}
```

---

## Files to change in `packages/cli`

### `src/commands/mcp.ts`
Add `--port` (`-p`) and `--host` options:
```typescript
port: { type: 'string', short: 'p', description: 'Port for HTTP MCP server (omit for stdio)', hint: 'number' },
host: { type: 'string', description: 'Hostname to bind to', default: 'localhost' },
```

### `src/runners/mcp.ts`
Pass port/host through to `run()`:
```typescript
await mod.run(undefined, {
  port: options.port !== undefined ? Number(options.port) : undefined,
  host: options.host,
})
```

---

## Changeset
- `@kubb/mcp`: minor (new tools, new dependency, new export `createMcpServer`)
- `@kubb/cli`: patch (new flags on `mcp` command)

---

## Verification
1. `pnpm --filter @kubb/mcp build` — dist artifacts produced
2. `pnpm --filter @kubb/mcp typecheck`
3. Stdio: `node packages/mcp/bin/kubb-mcp.cjs` + `{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}` via stdin → 3 tools listed
4. HTTP: `node packages/mcp/bin/kubb-mcp.cjs --port 3001` + `curl -X POST http://localhost:3001/mcp ...`
5. MCP Inspector: `npx @modelcontextprotocol/inspector node ./packages/mcp/bin/kubb-mcp.cjs`
