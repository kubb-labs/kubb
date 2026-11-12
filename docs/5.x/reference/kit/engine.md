---
layout: doc
title: Engine
description: The programmatic engine from the kubb package. Covers createKubb,
  the Kubb instance, BuildOutput, and the Diagnostics helpers that narrow a
  build's problems.
outline:
  - 2
  - 3
order: 10
navigation:
  title: Engine
  icon: i-iconoir-cpu

---

# Engine

Import `createKubb` from the `kubb` package to run a build from your own code. For the config file shape and the defaults the package applies, see [Configuration](/docs/5.x/reference/configuration).

## `createKubb` {#createkubb}

`createKubb` accepts a `UserConfig` and returns a `Kubb` instance. Call `.safeBuild()` to run the pipeline and read the problems back from `BuildOutput`, or `.build()` to throw instead. An optional second argument takes `hooks`, a `Hookable<KubbHooks>` to share one emitter between builds, and `signal`, an `AbortSignal` that stops the build at the next checkpoint.

Use `createKubb` to orchestrate several builds, inspect diagnostics, or feed Kubb output into a larger toolchain. `createKubb` applies the same defaults as `defineConfig`, so a shared config generates the same files from the CLI and from a script. Import it from `@kubb/core` for a bare engine without package defaults.

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
files.forEach((file) => console.log(`  ${file.path}`))
```

### `Kubb` instance members

| Member         | Type                                              | Description |
| -------------- | ------------------------------------------------- | ----------- |
| `.setup()`     | `() => Promise<void>`                             | Initializes the driver and storage. The build methods call it when needed. |
| `.safeBuild()` | `() => Promise<BuildOutput>`                      | The canonical call. Runs the pipeline and collects problems in `BuildOutput.diagnostics` instead of throwing. |
| `.build()`     | `() => Promise<BuildOutput>`                      | Runs `safeBuild()` and throws an `AggregateError` holding every error diagnostic when one has `severity: 'error'`. |
| `.generate()`  | `(options?) => Promise<GenerateResult>`           | Runs one full generation, including the `kubb:generation:*` hooks and the optional `processOutput` pass. Never throws on a build error. Returns `{ success, files, diagnostics, input }`. |
| `.dispose()`   | `() => void`                                      | Releases the driver. The next build sets up a new one. The instance also implements `Symbol.dispose`, so `using kubb = createKubb(config)` disposes it for you. |
| `.hooks`       | `Hookable<KubbHooks>`                             | Read-only. Shared hook emitter. Call `.hook(name, handler)` before a build to listen. See [lifecycle hooks](./hooks). |
| `.config`      | `Config`                                          | Read-only. Resolved config, available right after `createKubb`. |
| `.storage`     | `Storage`                                         | Read-only. The configured storage backend (`config.storage`), available right after `createKubb`. Generated files are written under their absolute path. |
| `.driver`      | driver handle                                     | Advanced plugin driver, available after `setup()` until the build ends. Throws before and after. |

### `Kubb.generate(configs)` {#kubb-generate}

To build every config of a [`defineConfig([...])` array](/docs/5.x/reference/configuration#multiple-configurations-array), call the static `Kubb.generate` from `@kubb/core`. It is what `kubb generate` runs.

```typescript [build.ts]
import { Kubb } from '@kubb/core'
import configs from './kubb.config.ts'

for await (const { success, files, kubb } of Kubb.generate(configs)) {
  console.log(kubb.config.name, success ? `${files.length} files` : 'failed')
}
```

- The configs build one after another, and each result is yielded as its config finishes. A result you do not keep is released before the next config builds, so a large array never holds every config's files in memory.
- A config that fails does not stop the others: its result has `success: false`.
- Configs that set the same [`shared`](/docs/5.x/reference/configuration#shared) path are compared first, so each build writes the schemas it shares to that directory.
- Each result is a `GenerateResult` with the `kubb` instance that built it, to read its `config`, `storage` or `hooks`.
- Pass `{ only: index }` to build one config of the array. It is still compared with the others, and never empties the directory they share.

### `BuildOutput` fields {#buildoutput-fields}

| Field         | Type                | Description |
| ------------- | ------------------- | ----------- |
| `files`       | `Array<FileNode>`   | Generated files with paths, names, and content |
| `storage`     | `Storage`           | Generated source code behind the `Storage` API |
| `driver`      | driver handle       | Plugin driver for introspection |
| `diagnostics` | `Array<Diagnostic>` | Problems collected during the build, plus a `performance` diagnostic per plugin |
| `input`       | `InputNode \| null` | The parsed spec the build generated from, `null` when there was none to parse |

Each problem diagnostic carries a `code`, a `severity` (`error`, `warning`, or `info`), a `message`, and the `plugin` that produced it. A failed plugin keeps its original error on `cause`. A `performance` diagnostic (`kind: 'performance'`) carries a `duration` in milliseconds.

> [!WARNING]
> After `safeBuild()`, check `Diagnostics.hasError(diagnostics)` before you process files. Plugins can fail without `safeBuild()` throwing.

## `Diagnostics` {#diagnostics}

`Diagnostics` from `kubb/kit` builds and narrows the structured errors a build collects. A plugin or adapter throws a `Diagnostics.Error` instead of a bare `Error` to attach a stable code, a severity, and a location. The codes are listed in the [diagnostics reference](/docs/5.x/reference/diagnostics).

| Member                      | Purpose |
| --------------------------- | ------- |
| `Diagnostics.Error`         | Error class (`DiagnosticError`) that carries a `ProblemDiagnostic` with `code`, `severity`, `message`, and `location` |
| `Diagnostics.report`        | Collects a diagnostic into the running build without throwing. Use a `warning` or `info` severity for non-fatal issues |
| `Diagnostics.from`          | Coerces any thrown value into a `ProblemDiagnostic`. Anything that is not a `Diagnostics.Error` becomes `KUBB_UNKNOWN` |
| `Diagnostics.hasError`      | `true` when any diagnostic has `severity: 'error'` |
| `Diagnostics.isProblem`     | Narrows to the `problem` kind |
| `Diagnostics.isPerformance` | Narrows to the `performance` kind, which carries a per-plugin `duration` |
| `Diagnostics.isUpdate`      | Narrows to the `update` kind, emitted when a newer Kubb version exists |
| `Diagnostics.count`         | Totals errors, warnings, and infos |
| `Diagnostics.explain`       | Returns the catalog entry (title, fix, docs URL) for a code |

```typescript [adapter.ts]
import { Diagnostics } from 'kubb/kit'

throw new Diagnostics.Error({
  code: Diagnostics.code.refNotFound,
  severity: 'error',
  message: 'Could not find a definition for #/components/schemas/Pet.',
  location: { kind: 'schema', pointer: '#/components/schemas/Pet', ref: '#/components/schemas/Pet' },
})
```
