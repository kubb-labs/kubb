import { createKubb as createKubbCore, type CreateKubbOptions, type Kubb, type UserConfig } from '@kubb/core'
import { applyDefaults } from './defineConfig.ts'

/**
 * Drives Kubb from your own code without the CLI, filling in the same defaults as {@link defineConfig}.
 *
 * Unlike `createKubb` from `@kubb/core`, this wrapper ships `adapterOas`, the default parsers,
 * the built-in reporters, and `pluginBarrel` pre-installed, so a script needs only `kubb` on
 * its dependencies instead of `@kubb/core` plus the adapter and parser packages.
 *
 * Defaults applied when omitted:
 * - `adapter` → `adapterOas()` (OpenAPI 2.0/3.0/3.1).
 * - `parsers` → `[parserTs, parserTsx, parserMd]`.
 * - `reporters` → `[cliReporter, jsonReporter, fileReporter]`.
 * - `plugins` → `pluginBarrel()` is appended when not already present.
 * - `output.barrel` → `{ type: 'named' }` only when `pluginBarrel` is in the plugins list.
 * - `output.format` and `output.lint` → `false`.
 *
 * Call `.build()` to run the full pipeline and throw on errors, or `.safeBuild()` to collect
 * problems in `BuildOutput.diagnostics` instead. Attach listeners to `.hooks` before either call.
 *
 * @example
 * ```ts
 * import { createKubb } from 'kubb'
 * import { pluginTs } from '@kubb/plugin-ts'
 *
 * const kubb = createKubb({
 *   input: { path: './petStore.yaml' },
 *   output: { path: './src/gen' },
 *   plugins: [pluginTs()],
 * })
 *
 * const { files } = await kubb.build()
 * ```
 */
export function createKubb(config: UserConfig, options?: CreateKubbOptions): Kubb {
  return createKubbCore(applyDefaults(config), options)
}
