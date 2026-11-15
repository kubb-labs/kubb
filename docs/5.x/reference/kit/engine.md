---
layout: doc
title: Engine
description: The programmatic engine from the kubb package. Covers createKubb,
  the Kubb instance and how its build methods relate, Kubb.generate for config
  arrays, BuildOutput, and the Diagnostics helpers.
outline:
  - 2
  - 3
order: 6
navigation:
  title: Engine
  icon: i-iconoir-cpu

---

# Engine

Run a build from your own code with `createKubb` from the `kubb` package. For the config shape and its defaults, see [Configuration](/docs/5.x/reference/configuration).

## `createKubb` {#createkubb}

`createKubb(config, options?)` returns a `Kubb` instance. It applies the same defaults as `defineConfig`, so a config generates the same files from the CLI and from a script. `createKubb` from `@kubb/core` skips those defaults.

| Option     | Type                  | Does                                                              |
| ---------- | --------------------- | ----------------------------------------------------------------- |
| `hooks`    | `Hookable<KubbHooks>` | Shares one [hook](/docs/5.x/reference/kit/hooks) emitter between builds. |
| `signal`   | `AbortSignal`         | Stops the build at the next safe checkpoint.                      |
| `fileRefs` | `Array<string>`       | The only folders a `$ref` in the input may read local files from. |

```typescript [build.ts]
import { createKubb } from 'kubb'
import { Diagnostics } from 'kubb/kit'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginAxios } from '@kubb/plugin-axios'

const kubb = createKubb({
  input: './petStore.yaml',
  output: { path: './gen' },
  plugins: [pluginTs(), pluginAxios()],
})

const { files, diagnostics } = await kubb.safeBuild()

if (Diagnostics.hasError(diagnostics)) {
  for (const diagnostic of diagnostics.filter(Diagnostics.isProblem)) {
    if (diagnostic.severity === 'error') {
      console.error(`${diagnostic.plugin ?? 'kubb'}: ${diagnostic.message}`)
    }
  }
  process.exit(1)
}

for (const { plugin, duration } of diagnostics.filter(Diagnostics.isPerformance)) {
  console.log(`${plugin}: ${duration}ms`)
}
console.log(`Generated ${files.length} files`)
```

> [!WARNING]
> `safeBuild()` does not throw when a plugin fails. Check `Diagnostics.hasError(diagnostics)` before you use the files.

### `Kubb` instance members

The build methods build on each other:

```mermaid
flowchart LR
  many["Kubb.generate(configs)"] -->|each config| generate[".generate()"]
  generate -->|adds generation hooks and output passes| safeBuild[".safeBuild()"]:::core
  build[".build()"] -->|throws on errors| safeBuild
  safeBuild -->|when needed| setup[".setup()"]
```

| Member         | Type                                    | Description                                                                                                                                      |
| -------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `.safeBuild()` | `() => Promise<BuildOutput>`            | The main call. Runs the pipeline and collects problems in `BuildOutput.diagnostics` instead of throwing.                                         |
| `.build()`     | `() => Promise<BuildOutput>`            | Runs `safeBuild()`, then throws an `AggregateError` of every error diagnostic.                                                                    |
| `.generate()`  | `(options?) => Promise<GenerateResult>` | Runs one full generation: the `kubb:generation:*` and `kubb:setup:*` hooks, the build, and the output passes. Returns `{ success, files, diagnostics, input }` and never throws on a build error. `options.processOutput` replaces the output passes. |
| `.setup()`     | `() => Promise<void>`                   | Sets up the driver and storage. The build methods call it when needed.                                                                          |
| `.dispose()`   | `() => void`                            | Releases the driver. The next build sets up a new one. The instance also implements `Symbol.dispose`, so `using kubb = createKubb(config)` disposes it. |
| `.hooks`       | `Hookable<KubbHooks>`                   | Read-only. The hook emitter. Call `.hook(name, handler)` before a build to listen.                                                               |
| `.config`      | `Config`                                | Read-only. The resolved config, available right after `createKubb`.                                                                              |
| `.storage`     | `Storage`                               | Read-only. The configured [storage](/docs/5.x/reference/kit/storage) backend. Files are stored under their absolute path.                        |
| `.driver`      | driver handle                           | The plugin driver, from `setup()` until the build ends. Throws outside that window.                                                              |

### `Kubb.generate(configs)` {#kubb-generate}

The static `Kubb.generate` from `@kubb/core` builds every config of a [`defineConfig([...])` array](/docs/5.x/reference/configuration#multiple-configurations-array). `kubb generate` runs it. A second argument takes `hooks` and `signal`.

```typescript [build.ts]
import { Kubb } from '@kubb/core'
import configs from './kubb.config.ts'

for await (const { success, files, kubb } of Kubb.generate(configs)) {
  console.log(kubb.config.name, success ? `${files.length} files` : 'failed')
}
```

- Configs build one after another, and each result is yielded when its config finishes, so memory holds one config at a time.
- A failing config does not stop the others. Its result has `success: false`, and `error` holds what it threw outside its diagnostics. Only an aborted `signal` rejects.
- Each result is a `GenerateResult` plus the `kubb` instance that built it.

### `BuildOutput` fields {#buildoutput-fields}

| Field         | Type                | Description                                                                     |
| ------------- | ------------------- | ------------------------------------------------------------------------------- |
| `files`       | `Array<FileNode>`   | The generated files, with paths, names, and content.                            |
| `storage`     | `Storage`           | The storage backend that holds the generated source.                            |
| `driver`      | driver handle       | The plugin driver, for introspection.                                           |
| `diagnostics` | `Array<Diagnostic>` | Problems collected during the build, plus a `performance` diagnostic per plugin. |
| `input`       | `InputNode \| null` | The parsed spec, or `null` when there was none to parse.                        |

A problem diagnostic has a `code`, a `severity` (`error`, `warning`, or `info`), a `message`, and the `plugin` that produced it, plus an optional `location`, `help`, and `issues` URL. A failed plugin keeps its original error on `cause`. A `performance` diagnostic has a `duration` in milliseconds.

## `Diagnostics` {#diagnostics}

`Diagnostics` from `kubb/kit` builds and narrows the problems a build collects. Throw a `Diagnostics.Error` instead of a bare `Error` to attach a stable code, a severity, and a location. The [diagnostics reference](/docs/5.x/reference/diagnostics) lists every code.

| Member                      | Does                                                                                                         |
| --------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `Diagnostics.Error`         | Error class that carries a problem diagnostic with `code`, `severity`, `message`, `location`, and `help`.    |
| `Diagnostics.code`          | The code catalog, such as `Diagnostics.code.refNotFound`.                                                    |
| `Diagnostics.report`        | Adds a diagnostic to the running build without throwing. Returns `false` outside a build. Use `warning` or `info` for problems that should not fail it. |
| `Diagnostics.from`          | Turns any thrown value into a problem diagnostic. Anything that is not a `Diagnostics.Error` becomes `KUBB_UNKNOWN`. |
| `Diagnostics.hasError`      | `true` when any diagnostic has `severity: 'error'`.                                                          |
| `Diagnostics.isProblem`     | Narrows to the `problem` kind.                                                                               |
| `Diagnostics.isPerformance` | Narrows to the `performance` kind, which has a per-plugin `duration`.                                        |
| `Diagnostics.isUpdate`      | Narrows to the `update` kind, emitted when a newer Kubb version exists.                                      |
| `Diagnostics.count`         | Counts errors, warnings, and infos.                                                                          |
| `Diagnostics.explain`       | Returns a code's catalog entry: `title`, `cause`, and `fix`.                                                 |
| `Diagnostics.docsUrl`       | Returns a code's kubb.dev URL.                                                                               |

```typescript [adapter.ts]
import { Diagnostics } from 'kubb/kit'

throw new Diagnostics.Error({
  code: Diagnostics.code.refNotFound,
  severity: 'error',
  message: 'Could not find a definition for #/components/schemas/Pet.',
  location: { kind: 'schema', pointer: '#/components/schemas/Pet', ref: '#/components/schemas/Pet' },
})
```
