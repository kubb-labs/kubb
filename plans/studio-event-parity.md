# Studio event parity with `@kubb/core`

## Context

The agent forwards a subset of `KubbHooks` to Studio over WebSocket (`packages/agent/server/utils/ws.ts`).
The agent's local `KubbHooks` type (`packages/agent/server/types/agent.ts`) mirrors only that forwarded
subset. Several core events are never sent, and one recently changed shape — making Studio's UI incomplete
and its type definitions stale.

This plan tracks every gap between `@kubb/core`'s full `KubbHooks` and what Studio currently receives.

---

## Gap 1 — `kubb:files:processing:update` shape change (breaking, already in agent)

The event was migrated from per-file (`kubb:file:processing:update`) to a batch payload in
`packages/core/src/createKubb.ts` and `packages/agent/server/types/agent.ts`. Studio must update
every handler that consumed the old shape.

### Old shape (per message)
```ts
{ file: string; processed: number; total: number; percentage: number }
```

### New shape
```ts
{ files: Array<{ file: string; processed: number; total: number; percentage: number }> }
```

**Files to change in Studio:**
- Any progress bar / file list component that listens to `kubb:files:processing:update`
- Replace the single-item update with an iteration over `ctx.files`

---

## Gap 2 — `kubb:lifecycle:end` typed but never forwarded

`agent/server/types/agent.ts` declares `'kubb:lifecycle:end': []` but `ws.ts` does not register a
listener for it. Studio never learns when the full lifecycle (format, lint, hooks) finishes.

**Fix — `packages/agent/server/utils/ws.ts`:**
```ts
hooks.on('kubb:lifecycle:end', () => {
  sendDataMessage({ type: 'kubb:lifecycle:end', data: [], timestamp: Date.now() })
})
```

---

## Gap 3 — Events missing from agent's `KubbHooks` type and not forwarded

The following core events are emitted by the CLI runner but never reach Studio. Add them to
`agent/server/types/agent.ts` and register listeners in `ws.ts`.

### `kubb:build:start`
Emitted once per config entry at the start of the plugin pipeline.

```ts
// agent KubbHooks entry
'kubb:build:start': [ctx: { config: { name?: string }; adapter: { name: string } }]

// ws.ts
hooks.on('kubb:build:start', ({ config, adapter }) => {
  sendDataMessage({
    type: 'kubb:build:start',
    data: [{ config: { name: config.name }, adapter: { name: adapter.name } }],
    timestamp: Date.now(),
  })
})
```

### `kubb:build:end`
Emitted once per config entry when all plugins and file writes have completed. Carries the full
generated file list — useful for Studio's file tree.

```ts
// agent KubbHooks entry
'kubb:build:end': [ctx: { files: Array<{ path: string; name: string }>; outputDir: string }]

// ws.ts
hooks.on('kubb:build:end', ({ files, outputDir }) => {
  sendDataMessage({
    type: 'kubb:build:end',
    data: [{ files: files.map((f) => ({ path: f.path, name: f.name })), outputDir }],
    timestamp: Date.now(),
  })
})
```

### `kubb:generation:summary`
Emitted by the CLI after all config entries finish. Carries per-plugin timing and failure info.

```ts
// agent KubbHooks entry
'kubb:generation:summary': [ctx: { duration: number; fileCount: number; failedPlugins: number }]

// ws.ts — shape TBD once KubbGenerationSummaryContext is inspected
```

### `kubb:lifecycle:start`
Emitted before format/lint/hooks runs. Pair with `kubb:lifecycle:end` for a complete lifecycle span.

```ts
// agent KubbHooks entry
'kubb:lifecycle:start': []

// ws.ts
hooks.on('kubb:lifecycle:start', () => {
  sendDataMessage({ type: 'kubb:lifecycle:start', data: [], timestamp: Date.now() })
})
```

### `kubb:format:start` / `kubb:format:end`
Bracket the formatter run. Useful for Studio's timeline view.

```ts
'kubb:format:start': []
'kubb:format:end': []
```

### `kubb:lint:start` / `kubb:lint:end`
Bracket the linter run.

```ts
'kubb:lint:start': []
'kubb:lint:end': []
```

---

## Gap 4 — Events to deliberately skip

These core events carry too much data or are too granular to be useful over the wire:

| Event | Reason to skip |
|---|---|
| `kubb:generate:schema` | Fires per-schema per-plugin — thousands of messages per build |
| `kubb:generate:operation` | Same — per-operation per-plugin |
| `kubb:generate:operations` | Carries the full `OperationNode[]` graph — too large to serialize |
| `kubb:plugin:setup` | Internal wiring detail, no UI value |
| `kubb:plugins:end` | Superseded by `kubb:build:end` for Studio's purposes |
| `kubb:debug` | Verbose internal logs, already shown in CLI |
| `kubb:config:start` / `kubb:config:end` | CLI-only config resolution phase, agent never runs this |
| `kubb:hook:start` / `kubb:hook:end` / `kubb:hooks:start` / `kubb:hooks:end` | Fine-grained hook runner events |
| `kubb:version:new` | Update check, CLI-only concern |

---

## Implementation order

1. **Studio frontend** — handle new `kubb:files:processing:update` batch shape (Gap 1, unblocks existing builds)
2. **`ws.ts`** — forward `kubb:lifecycle:end` (Gap 2, one-liner)
3. **`agent/server/types/agent.ts` + `ws.ts`** — add `kubb:build:start` and `kubb:build:end` (Gap 3, highest UI value)
4. **`agent/server/types/agent.ts` + `ws.ts`** — add `kubb:lifecycle:start`, `kubb:format:*`, `kubb:lint:*` (Gap 3, timeline view)
5. **`agent/server/types/agent.ts` + `ws.ts`** — add `kubb:generation:summary` once shape is confirmed (Gap 3)
