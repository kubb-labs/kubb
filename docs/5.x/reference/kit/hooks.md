---
layout: doc
title: Lifecycle hooks - Every kubb:* build event
description: Every kubb:* hook a build fires, its payload, and when it fires.
  Listen with kubb.hooks.hook(name, handler) or from a plugin's hooks map.
outline:
  - 2
  - 3
order: 11
navigation:
  title: Lifecycle hooks
  icon: i-iconoir-refresh-double
---

# Lifecycle hooks

Hooks let you run code in every build phase. Each phase fires a `kubb:*` hook on one shared emitter, typed by `KubbHooks`. Handlers can be async, and Kubb awaits each one.

| Listener                                                          | Receives                                                  |
| ----------------------------------------------------------------- | --------------------------------------------------------- |
| A plugin's [`hooks`](/docs/5.x/reference/kit/plugins) map | The hooks from `kubb:setup:end` to `kubb:build:end`, including its own `kubb:plugin:setup`. It misses the `lifecycle` and `generation` hooks, `kubb:setup:start`, and the output passes. |
| `kubb.hooks.hook(name, handler)` from [`createKubb`](/docs/5.x/reference/kit/engine#createkubb) | Every hook except `kubb:plugin:setup`                     |

## Listening

Attach listeners before you call `build()`. `hook()` returns a function that removes the listener.

```ts
import { createKubb } from 'kubb'

const kubb = createKubb({
  input: './petStore.yaml',
  output: { path: './gen' },
})

kubb.hooks.hook('kubb:plugin:end', ({ plugin, duration }) => {
  console.log(`${plugin.name} finished in ${duration}ms`)
})

kubb.hooks.hook('kubb:build:end', ({ files }) => {
  console.log(`Generated ${files.length} files`)
})

await kubb.build()
```

## Firing order

A full generation run fires the hooks in this order.

::lifecycle-timeline
::

## Generation run

`.generate()` fires the `generation` and `setup` hooks. The CLI adds the `lifecycle` pair around all configs. A direct `.build()` or `.safeBuild()` fires none of them.

| Hook                      | Payload                                                           | Fires                                                                                       |
| ------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `kubb:lifecycle:start`    | `{ version }`                                                     | When `kubb generate` starts, before the first config. CLI only.                             |
| `kubb:generation:start`   | `{ config }`                                                      | When a run begins, before setup.                                                            |
| `kubb:setup:start`        | none                                                              | Before the driver and storage are set up.                                                   |
| `kubb:setup:end`          | none                                                              | After setup, before the build pipeline.                                                     |
| `kubb:generation:end`     | `{ config, storage, status, diagnostics, filesCreated, hrStart }` | When the run finishes, after the output passes.                                             |
| `kubb:generation:summary` | `{ duration, fileCount, failedPlugins, status }`                  | Right after `kubb:generation:end`, with the run's totals. `duration` is in milliseconds.    |
| `kubb:lifecycle:end`      | none                                                              | After the last config. CLI only.                                                            |

## Build pipeline

`.generate()`, `.build()`, and `.safeBuild()` all fire these hooks.

| Hook                           | Payload                                                               | Fires                                                                                                                                       |
| ------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `kubb:plugin:setup`            | [`KubbPluginSetupContext`](/docs/5.x/reference/kit/plugins#setup-context) | Once per plugin, after its `setup` and before `kubb:build:start`.                                                                     |
| `kubb:build:start`             | `{ config, adapter, meta, nodeCounts, getPlugin, files, upsertFile }` | When the AST is ready, before plugins run. Skipped when no adapter parsed input.                                                            |
| `kubb:plugin:start`            | `{ plugin }`                                                          | Before a plugin's generators run.                                                                                                           |
| `kubb:generate:schema`         | `(node, ctx)`                                                         | For each schema node.                                                                                                                       |
| `kubb:generate:operation`      | `(node, ctx)`                                                         | For each operation node.                                                                                                                    |
| `kubb:generate:operations`     | `(nodes, ctx)`                                                        | Once, with every operation node.                                                                                                            |
| `kubb:plugin:end`              | `{ plugin, duration, success, error, config, files, upsertFile }`     | After a plugin finishes.                                                                                                                    |
| `kubb:plugins:end`             | `{ config, files, upsertFile }`                                       | After every plugin, before files reach the storage. Add aggregate files, such as a barrel, here.                                            |
| `kubb:files:processing:start`  | `{ files }`                                                           | Before the generated files are written.                                                                                                     |
| `kubb:files:processing:update` | `{ files }`                                                           | As files are written. `files` holds progress records (`{ processed, total, percentage, file, config }`), not `FileNode`s.                  |
| `kubb:file:processed`          | `{ file, source, stored }`                                            | After each file is printed and handed to the storage. `stored` is the previous content, or `null`. See [File hook payloads](#file-hook-payloads). |
| `kubb:files:processing:end`    | `{ files, unchanged }`                                                | After every file is written. `unchanged` lists the paths whose content did not change.                                                      |
| `kubb:build:end`               | `{ files, config, outputDir }`                                        | After every file is written and the adapter has settled.                                                                                    |

## Output passes

These hooks fire after a build without errors, only from `.generate()` with `fsStorage`. Each group fires only when the config sets `output.format`, `output.lint`, or `output.postGenerate`.

| Hook                 | Payload                                         | Fires                                                |
| -------------------- | ----------------------------------------------- | ---------------------------------------------------- |
| `kubb:format:start`  | none                                            | Before the formatter runs.                           |
| `kubb:format:end`    | none                                            | After formatting.                                    |
| `kubb:lint:start`    | none                                            | Before the linter runs.                              |
| `kubb:lint:end`      | none                                            | After linting.                                       |
| `kubb:hooks:start`   | none                                            | Before the `postGenerate` commands run.              |
| `kubb:hook:start`    | `{ id, command, name, args }`                   | Before one `postGenerate` command runs.              |
| `kubb:hook:line`     | `{ id, line }`                                  | For each output line of a `postGenerate` command.    |
| `kubb:hook:end`      | `{ id, command, name, args, success, error }`   | After one `postGenerate` command finishes. A failed command also carries `stdout` and `stderr`. |
| `kubb:hooks:end`     | none                                            | After every `postGenerate` command.                  |

## Messaging

These hooks carry log messages and diagnostics, and fire at any point.

| Hook              | Payload             | Fires for                                                                                               |
| ----------------- | ------------------- | ------------------------------------------------------------------------------------------------------- |
| `kubb:info`       | `{ message, info }` | An informational message.                                                                               |
| `kubb:success`    | `{ message, info }` | A step that completed.                                                                                  |
| `kubb:warn`       | `{ message, info }` | A problem that does not fail the build.                                                                 |
| `kubb:error`      | `{ error, meta }`   | An error without a diagnostic code, so its stack survives.                                              |
| `kubb:diagnostic` | `{ diagnostic }`    | A coded error, warning, or info, or an update notice. See [diagnostics](/docs/5.x/reference/diagnostics). |

[Architecture](/docs/5.x/introduction/architecture#lifecycle) explains the lifecycle.

## Less common cases {#less-common-cases}

### Hook listener scope {#hook-listener-scope}

When your plugin listens through its `hooks` map, it gets the hooks from `kubb:setup:end` to `kubb:build:end`, including its own `kubb:plugin:setup`.

- Kubb adds these listeners during setup and removes them when the build ends.
- They miss the `lifecycle` and `generation` hooks, `kubb:setup:start`, and the output passes.
- `kubb:plugin:setup` fires once per plugin, after its `setup` and before `kubb:build:start`. Kubb calls the plugin's own handler directly.
- Each listener runs with a context as `this`, the same object `useKubb()` returns. For a hook Kubb fires, such as `kubb:build:start` or `kubb:plugins:end`, that is the plugin's own visit context, the `ctx` its visit hooks get. For a hook fired inside another hook, it is the context of the hook that fired it.
- `kubb:lifecycle:start` fires when `kubb generate` starts, before the first config. `.generate()` and the bundler plugins skip it.

### Visit hooks {#visit-hooks}

A plugin's `hooks` map can also hold four visit hooks. Kubb calls them for that plugin only, while it walks the input, and they never reach `kubb.hooks`.

| Hook                          | Payload       | Fires                                                |
| ----------------------------- | ------------- | ---------------------------------------------------- |
| `kubb:plugin:visit:start`     | `(ctx)`       | Once, before the first schema.                       |
| `kubb:plugin:visit:schema`    | `(node, ctx)` | For each schema node, before the operations.         |
| `kubb:plugin:visit:operation` | `(node, ctx)` | For each operation node.                             |
| `kubb:plugin:visit:end`       | `(ctx)`       | Once, after the last operation.                      |

`ctx` is the generator context without `resolver`, `getResolver` and per-node `options`, which only generators get. A plugin defined with `defineExtension` from `kubb/kit` runs its generators before its own visit hooks, with a resolver fixed when the walk starts. Each node reaches every plugin in plugin order before the walk moves on. When a visit hook throws, Kubb stops that plugin, reports `KUBB_PLUGIN_FAILED`, and runs the other plugins to the end. For the schema and operation hooks, the diagnostic names the node it failed on.

### File hook payloads {#file-hook-payloads}

When you listen to `kubb:file:processed`, you get `{ file, source, stored }` after each file is printed and handed to the storage.

| Field | Holds |
| --- | --- |
| `source` | The text before any output pass. |
| `stored` | What the storage held at that path, or `null` when the path was empty or `output.clean` emptied its folder. |
