---
'@kubb/core': minor
'@kubb/cli': patch
'@kubb/plugin-oas': patch
'unplugin-kubb': patch
'@kubb/agent': patch
'@kubb/mcp': patch
---

## Prefix all `KubbEvents` event names with `kubb:`

All event names in the `KubbEvents` interface are now namespaced with the `kubb:` prefix to avoid naming collisions and make the event origin explicit.

### Breaking change

Update all `events.on(...)`, `events.emit(...)`, `events.off(...)`, and `events.once(...)` calls to use the new prefixed event names.

**Before:**
```ts
events.on('plugin:end', (plugin, { duration }) => { ... })
events.on('error', (error) => { ... })
events.on('generation:start', (config) => { ... })
```

**After:**
```ts
events.on('kubb:plugin:end', (plugin, { duration }) => { ... })
events.on('kubb:error', (error) => { ... })
events.on('kubb:generation:start', (config) => { ... })
```

### Full list of renamed events

| Before | After |
|---|---|
| `lifecycle:start` | `kubb:lifecycle:start` |
| `lifecycle:end` | `kubb:lifecycle:end` |
| `config:start` | `kubb:config:start` |
| `config:end` | `kubb:config:end` |
| `generation:start` | `kubb:generation:start` |
| `generation:end` | `kubb:generation:end` |
| `generation:summary` | `kubb:generation:summary` |
| `format:start` | `kubb:format:start` |
| `format:end` | `kubb:format:end` |
| `lint:start` | `kubb:lint:start` |
| `lint:end` | `kubb:lint:end` |
| `hooks:start` | `kubb:hooks:start` |
| `hooks:end` | `kubb:hooks:end` |
| `hook:start` | `kubb:hook:start` |
| `hook:end` | `kubb:hook:end` |
| `version:new` | `kubb:version:new` |
| `info` | `kubb:info` |
| `error` | `kubb:error` |
| `success` | `kubb:success` |
| `warn` | `kubb:warn` |
| `debug` | `kubb:debug` |
| `files:processing:start` | `kubb:files:processing:start` |
| `files:processing:end` | `kubb:files:processing:end` |
| `file:processing:update` | `kubb:file:processing:update` |
| `plugin:start` | `kubb:plugin:start` |
| `plugin:end` | `kubb:plugin:end` |
| `plugins:hook:progress:start` | `kubb:plugins:hook:progress:start` |
| `plugins:hook:progress:end` | `kubb:plugins:hook:progress:end` |
| `plugins:hook:processing:start` | `kubb:plugins:hook:processing:start` |
| `plugins:hook:processing:end` | `kubb:plugins:hook:processing:end` |
