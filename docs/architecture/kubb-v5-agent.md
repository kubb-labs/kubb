# Kubb v5 — @kubb/agent Changes for Studio Support

This document covers the changes needed in the `@kubb/agent` package (`packages/agent/`) to fully support Kubb Studio's v5 migration. The agent is the process users run locally (`kubb agent start`) that connects to Studio via WebSocket and executes code generation on their machine.

## Affected Files

| File | Change |
|------|--------|
| `server/types/agent.ts` | Update `JSONKubbConfig` plugin options documentation; align `KubbHooks` subset with v5 event shapes |
| `server/utils/resolvePlugins.ts` | Verify v5 plugin package names resolve correctly via dynamic import |
| `server/utils/mergePlugins.ts` | Verify deep merge handles `barrel` object (not string) correctly |
| `server/utils/ws.ts` | Already correct — confirm `setupEventsStream` event shapes match studio expectations |
| `server/utils/connectStudio.ts` | Update `ConnectedMessage` config payload to reflect v5 config shape |

---

## Step 1 — Update `server/types/agent.ts`

### JSONKubbConfig — document v5 option shapes

The `plugins[].options` field is typed as `object`, which is permissive enough to accept both v4 and v5 formats. However the agent must correctly pass v5-shaped options to plugin factories. Ensure the inline documentation and any example schemas reflect the v5 barrel format:

```ts
// v4 (no longer valid)
{ name: '@kubb/plugin-ts', options: { barrelType: 'named' } }

// v5
{ name: '@kubb/plugin-ts', options: { barrel: { type: 'named' } } }
```

### KubbHooks subset — align data shapes with ws.ts

The `KubbHooks` type defined locally in `server/types/agent.ts` is the subset of events forwarded to Studio. Cross-check its data tuple shapes against what `setupEventsStream()` in `ws.ts` actually emits to ensure the discriminated union stays accurate:

| Event | Expected `data` shape |
|-------|-----------------------|
| `kubb:plugin:start` | `[plugin: { name: string }]` |
| `kubb:plugin:end` | `[plugin: { name: string }, meta: { duration: number; success: boolean }]` |
| `kubb:files:processing:start` | `[{ total: number }]` |
| `kubb:file:processing:update` | `[{ file: string; processed: number; total: number; percentage: number }]` |
| `kubb:files:processing:end` | `[{ total: number }]` |
| `kubb:generation:start` | `[{ name?: string; plugins: number }]` |
| `kubb:generation:end` | `[config: Config, files: FileNode[], sources: Record<string, string>]` |
| `kubb:info` | `[message: string, info?: unknown]` |
| `kubb:success` | `[message: string, info?: unknown]` |
| `kubb:warn` | `[message: string, info?: unknown]` |
| `kubb:error` | `[{ message: string; stack?: string }]` |

---

## Step 2 — Verify `server/utils/resolvePlugins.ts`

`resolvePlugins` dynamically imports plugin packages by name and resolves the factory function using a camelCase heuristic (`@kubb/plugin-ts` → `pluginTs`). This mechanism is unchanged in v5, but verify:

1. **Plugin package names** — v5 plugins live in `kubb-labs/plugins` (a separate monorepo). Confirm user-installed plugin packages export their factory under the expected camelCase name:
   - `@kubb/plugin-ts` → `pluginTs` ✓
   - `@kubb/plugin-zod` → `pluginZod` ✓
   - `@kubb/plugin-react-query` → `pluginReactQuery` ✓

2. **Peer dependency** — `@kubb/renderer-jsx` is now a required peer of all v5 plugins. The agent itself does not import it, but users must install it alongside any plugin or generation will fail. Consider adding a startup warning if `@kubb/renderer-jsx` is not resolvable.

3. **`toExportName` edge cases** — run the existing tests (`vitest`) against v5 plugin package names to confirm no naming edge cases regressed.

---

## Step 3 — Verify `server/utils/mergePlugins.ts`

`mergePlugins` deep-merges disk plugin options with studio-supplied options. In v5, the barrel configuration is an object instead of a string:

```ts
// Disk config (kubb.config.ts)
pluginTs({ output: { barrel: { type: 'named' } } })

// Studio JSON override
{ name: '@kubb/plugin-ts', options: { output: { barrel: { type: 'all' } } } }

// Expected merge result
{ output: { barrel: { type: 'all' } } }  // studio override wins
```

The existing deep merge (`remeda` or equivalent) handles nested object replacement correctly — confirm this with a focused test covering the `barrel` object shape. Also confirm `barrel: false` (opt-out) is preserved when the disk config sets it explicitly and studio does not override it.

---

## Step 4 — Confirm `server/utils/ws.ts` (`setupEventsStream`)

This function is already correct for v5 — it registers listeners on the `kubb:` prefixed hooks and forwards them to Studio as `DataMessage` frames. Two things to confirm:

1. **`kubb:generation:end` sources conversion** — the handler converts `Map<string, string>` → `Record<string, string>` before sending. Confirm this runs before `JSON.stringify` so no Map object is sent raw over the wire.

2. **`FileNode` cast** — the handler casts `files` to `FileNode[]` via `as unknown as FileNode[]`. If the v5 `safeBuild()` return type is already `FileNode[]`, remove the double cast to restore type safety.

---

## Step 5 — Update `server/utils/connectStudio.ts` (ConnectedMessage)

When the agent receives a `connect` command from Studio, it responds with a `ConnectedMessage` carrying the current disk config (for the Studio UI to display the existing plugin setup). After the v5 upgrade:

- The `config` payload in `ConnectedMessage` must serialize `barrel` as an object, not a string
- If the disk `kubb.config.ts` uses v5 format, this is automatic — no code change needed
- If the disk config uses v4 format (`barrelType`), the agent should **not** silently transform it; the user should migrate their `kubb.config.ts` manually

Add a startup validation step that checks the loaded config for v4-only fields (`barrelType`) and logs a deprecation warning:

```ts
if (plugin.options?.barrelType !== undefined) {
  logger.warn(`Plugin "${plugin.name}" uses deprecated "barrelType" option. Migrate to "barrel: { type }" for kubb v5.`)
}
```

---

## Verification

1. Run the agent test suite: `vitest run` inside `packages/agent/`
2. Start the agent against a v5 `kubb.config.ts` and connect to Studio — confirm the `ConnectedMessage` arrives with correct v5 config shape
3. Trigger generation from Studio — confirm all `kubb:` prefixed events stream correctly and `kubb:generation:end` delivers `FileNode[]` with `Record<string, string>` sources
4. Test the `barrel: false` opt-out case in mergePlugins to confirm it is not overwritten by a deep merge
5. Confirm a plugin installed without `@kubb/renderer-jsx` produces a clear error (not a silent failure)
