---
layout: doc
title: Lifecycle hooks
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

Kubb runs on one shared, typed hook emitter, and every phase of a build fires a `kubb:*` hook on it. Plugins listen through their [`hooks`](./plugins) map. Outside code listens through `kubb.hooks`. The exception is `kubb:plugin:setup`, which only a plugin's own `hooks` map receives.

Every hook name and its payload lives in the `KubbHooks` type. Handlers can be async, and Kubb awaits each one.

## Listening

Attach a listener with `kubb.hooks.hook(name, handler)` before you call `build()`.

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

These hooks wrap a full run. `.generate()` fires the `generation` and `setup` hooks, and the CLI adds the `lifecycle` pair around all configs. A direct `.build()` or `.safeBuild()` fires none of them.

| Hook                     | Payload                                                        | When it fires                                          |
| ------------------------ | ------------------------------------------------------------- | ------------------------------------------------------ |
| `kubb:lifecycle:start`   | `{ version }`                                                 | The CLI starts `kubb generate`, before the first config runs. `.generate()` and the bundler plugin do not fire it |
| `kubb:generation:start`  | `{ config }`                                                  | A run begins, before setup                             |
| `kubb:setup:start`       | none                                                          | Before the driver and storage are initialized          |
| `kubb:setup:end`         | none                                                          | After setup, before the build pipeline                 |
| `kubb:generation:end`    | `{ config, storage, status, diagnostics, filesCreated, hrStart }` | The run finishes, after the output passes         |
| `kubb:generation:summary` | `{ duration, fileCount, failedPlugins, status }`             | Right after `kubb:generation:end`, with the run's totals. `duration` is in milliseconds |
| `kubb:lifecycle:end`     | none                                                          | The CLI is done, after the last config                 |

## Build pipeline

The pipeline fires these hooks, so `.build()` and `.safeBuild()` fire them too.

| Hook                     | Payload                                                        | When it fires                                          |
| ------------------------ | ------------------------------------------------------------- | ------------------------------------------------------ |
| `kubb:plugin:setup`      | `KubbPluginSetupContext`                                      | Once per plugin, after its `setup` and before `kubb:build:start`, to register generators, resolvers, macros, and options. Kubb calls the handler in the plugin's `hooks` map directly, so a `kubb.hooks` listener never receives it |
| `kubb:build:start`       | `{ config, adapter, meta, nodeCounts, getPlugin, files, upsertFile }` | The AST is ready, before plugins run. Skipped when no adapter parsed input |
| `kubb:plugin:start`      | `{ plugin }`                                                  | Before a plugin's generators run                       |
| `kubb:generate:schema`   | `(node, ctx)`                                                 | For each schema node the adapter produced              |
| `kubb:generate:operation`| `(node, ctx)`                                                 | For each operation node                                |
| `kubb:generate:operations`| `(nodes, ctx)`                                               | Once with every operation node                         |
| `kubb:plugin:end`        | `{ plugin, duration, success, error, config, files, upsertFile }` | After a plugin finishes, with its timing and a file snapshot |
| `kubb:plugins:end`       | `{ config, files, upsertFile }`                              | After every plugin has generated, before files hit disk. The spot to add aggregate files like a barrel |
| `kubb:files:processing:start` | `{ files }`                                             | Before the batch of generated files is written         |
| `kubb:files:processing:update`| `{ files }`                                             | As files are written. Here `files` holds progress records (`{ processed, total, percentage, file, config }`), not the `FileNode` array the `:start` and `:end` variants carry. The source is on `kubb:file:processed` |
| `kubb:file:processed`    | `{ file, source, stored }`                                   | After each file is parsed and handed to the storage, with the source before any output pass rewrites it. `stored` is what the storage held at that path before the write, from the same read that decided whether to write, or `null` when the path was missing or `output.clean` just emptied its folder. Compare it during the hook, do not keep it |
| `kubb:files:processing:end` | `{ files, unchanged }`                                    | After the batch is written. `unchanged` lists the paths the storage already held with the same content |
| `kubb:build:end`         | `{ files, config, outputDir }`                               | After every file is written                            |

## Output passes

These hooks fire after a build without errors, only during a full generation run with the `fsStorage` backend. Each group fires only when the config sets `output.format`, `output.lint`, or `output.postGenerate`.

| Hook                 | Payload                              | When it fires                                    |
| -------------------- | ------------------------------------ | ------------------------------------------------ |
| `kubb:format:start`  | none                                 | Before the formatter runs                        |
| `kubb:format:end`    | none                                 | After formatting                                 |
| `kubb:lint:start`    | none                                 | Before the linter runs                           |
| `kubb:lint:end`      | none                                 | After linting                                    |
| `kubb:hooks:start`   | none                                 | Before the `postGenerate` commands run           |
| `kubb:hook:start`    | `{ id, command, name, args }`        | Before one `postGenerate` command runs           |
| `kubb:hook:line`     | `KubbHookLineContext`                | For each output line a `postGenerate` command emits |
| `kubb:hook:end`      | `KubbHookEndContext`                 | After one `postGenerate` command finishes        |
| `kubb:hooks:end`     | none                                 | After every `postGenerate` command               |

## Messaging

These hooks carry log messages and diagnostics, and can fire at any point.

| Hook              | Payload                     | When it fires                                        |
| ----------------- | --------------------------- | ---------------------------------------------------- |
| `kubb:info`       | `{ message, info }`         | An informational message                             |
| `kubb:success`    | `{ message, info }`         | A step completed successfully                        |
| `kubb:warn`       | `{ message, info }`         | A non-fatal problem                                  |
| `kubb:error`      | `{ error, meta }`           | An error without a diagnostic code, so its stack survives |
| `kubb:diagnostic` | `{ diagnostic }`            | A structured [diagnostic](../diagnostics): a coded error, warning, or info, or an update notice |

## Related

- [Plugins](./plugins) for the plugin `hooks` map and `KubbPluginSetupContext`
- [Engine](./engine) for `createKubb`, `.build()`, `.safeBuild()`, and `.generate()`
- [Plugin concepts](/docs/5.x/explanation/extensions#plugins) for the lifecycle as prose
- [Diagnostics](../diagnostics) for the shape of `kubb:diagnostic` payloads
