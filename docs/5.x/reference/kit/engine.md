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

`createKubb` accepts a `UserConfig` and returns a `Kubb` instance. Call `.safeBuild()` to run the pipeline and read the problems back from `BuildOutput`, or `.build()` to throw instead.

Reach for `createKubb` when you orchestrate several builds, inspect diagnostics, or feed Kubb output into a larger toolchain. It applies the same defaults as `defineConfig`, so a shared config generates the same files from the CLI and from a script. Import it from `@kubb/core` for a bare engine without package defaults.

```typescript twoslash [build.ts]
// @module: esnext
import { createKubb } from 'kubb'
import { Diagnostics } from 'kubb/kit'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginAxios } from '@kubb/plugin-axios'

const kubb = createKubb({
  input: './petStore.yaml',
  output: { path: './gen' },
  plugins: [pluginTs(), pluginAxios()],
})

const { files, storage, diagnostics } = await kubb.safeBuild()

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
const paths = await storage.readKeys()
paths.forEach((path) => console.log(`  ${path}`))
```

### `Kubb` instance members

| Member         | Type                                              | Description |
| -------------- | ------------------------------------------------- | ----------- |
| `.setup()`     | `() => Promise<void>`                             | Initializes the driver and storage. The build methods call it when needed. |
| `.safeBuild()` | `() => Promise<BuildOutput>`                      | The canonical call. Runs the pipeline and collects problems in `BuildOutput.diagnostics` instead of throwing. |
| `.build()`     | `() => Promise<BuildOutput>`                      | Runs `safeBuild()` and throws an `AggregateError` holding every error diagnostic when one has `severity: 'error'`. |
| `.generate()`  | `(options?) => Promise<GenerateResult>`           | Runs one full generation, including the `kubb:generation:*` hooks and the optional `processOutput` pass. Never throws on a build error. Returns `{ success, files, diagnostics }`. |
| `.dispose()`   | `() => void`                                      | Releases the driver. The instance also implements `Symbol.dispose`, so `using kubb = createKubb(config)` disposes it for you. |
| `.hooks`       | `Hookable<KubbHooks>`                             | Read-only. Shared hook emitter. Call `.hook(name, handler)` before a build to listen. See [lifecycle hooks](./hooks). |
| `.config`      | `Config`                                          | Read-only. Resolved config, available right after `createKubb`. |
| `.storage`     | `Storage`                                         | Read-only. Final source code keyed by absolute path. Available after `setup()`, throws before. |
| `.driver`      | driver handle                                     | Advanced plugin driver, available after `setup()`. Throws before. |

### `BuildOutput` fields {#buildoutput-fields}

| Field         | Type                | Description |
| ------------- | ------------------- | ----------- |
| `files`       | `Array<FileNode>`   | Generated files with paths, names, and content |
| `storage`     | `Storage`           | Generated source code behind the `Storage` API |
| `driver`      | driver handle       | Plugin driver for introspection |
| `diagnostics` | `Array<Diagnostic>` | Problems collected during the build, plus a `performance` diagnostic per plugin |

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

```typescript twoslash [adapter.ts]
import { Diagnostics } from 'kubb/kit'

throw new Diagnostics.Error({
  code: Diagnostics.code.refNotFound,
  severity: 'error',
  message: 'Could not find a definition for #/components/schemas/Pet.',
  location: { kind: 'schema', pointer: '#/components/schemas/Pet', ref: '#/components/schemas/Pet' },
})
```

## See also

- [Configuration reference](/docs/5.x/reference/configuration)
- [Lifecycle hooks](./hooks)
- [Diagnostics reference](/docs/5.x/reference/diagnostics)
