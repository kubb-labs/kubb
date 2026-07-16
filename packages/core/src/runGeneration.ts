import { resolve } from 'node:path'
import type { FileNode } from '@kubb/ast'
import { createKubb } from './createKubb.ts'
import { type Diagnostic, Diagnostics } from './Diagnostics.ts'
import type { Storage } from './createStorage.ts'
import type { KubbDriver } from './KubbDriver.ts'
import type { Config, Input, KubbHooks } from './types.ts'
import type { Hookable } from './Hookable.ts'

/**
 * A step in the generation lifecycle a host narrates. The runner calls `onPhase` at each one so a
 * host (the CLI) can emit its own progress messages without the runner knowing about presentation.
 *
 * - `'setup'` fires before `Kubb.setup()`.
 * - `'build'` fires before `Kubb.safeBuild()`.
 * - `'summary'` fires once the build has produced its files and diagnostics.
 */
export type GenerationPhase = 'setup' | 'build' | 'summary'

/**
 * Host-provided hooks for a single {@link runGeneration} call. Everything here is optional: a host
 * that only wants the build and its diagnostics (the bundler plugin, the MCP tool) passes just
 * `hooks`, while the CLI wires up the output passes, phase narration, and success message.
 */
export type RunGenerationOptions = {
  /**
   * The shared hook bus. `runGeneration` emits `kubb:generation:start` and `kubb:generation:end`
   * on it and renders diagnostics through it; the driver emits the inner build hooks.
   */
  hooks: Hookable<KubbHooks>
  /**
   * Overrides `config.input` for this run, matching the CLI's positional input argument.
   */
  input?: Input
  /**
   * High-resolution start time (`process.hrtime()`) carried into `kubb:generation:end` so a
   * reporter can show the elapsed time. Defaults to the moment the runner starts.
   */
  hrStart?: [number, number]
  /**
   * Called before each lifecycle {@link GenerationPhase} so the host can narrate progress.
   */
  onPhase?: (phase: GenerationPhase) => void | Promise<void>
  /**
   * Runs the post-build output passes (format, lint, `postGenerate`) and returns the diagnostics
   * they produced, already emitted. Only the CLI provides this; hosts that skip these passes leave
   * it unset. It runs only after a build with no error-level diagnostics.
   */
  runOutputPasses?: (context: { config: Config; outputPath: string; hooks: Hookable<KubbHooks> }) => Promise<Array<Diagnostic>>
  /**
   * Called after a successful run, before `kubb:generation:end`, so the host can emit its success
   * message in the same spot the CLI always has.
   */
  onSuccess?: () => void | Promise<void>
  /**
   * Surfaces one build diagnostic. Defaults to the CLI behavior: an unstructured error goes out as
   * `kubb:error` and everything else through `kubb:diagnostic`. A host that renders differently (the
   * bundler plugin routes by severity to its own channels) passes its own.
   */
  renderDiagnostic?: (context: { diagnostic: Diagnostic; hooks: Hookable<KubbHooks> }) => void | Promise<void>
}

/**
 * Everything a {@link runGeneration} call produced, for the host to map onto its own result shape
 * (an exit code, a bundler error, an MCP tool payload).
 */
export type GenerationResult = {
  /**
   * `true` when the build and every output pass completed without an error-level diagnostic.
   */
  success: boolean
  /**
   * All files generated during the build.
   */
  files: Array<FileNode>
  /**
   * Build diagnostics plus any collected from the output passes.
   */
  diagnostics: Array<Diagnostic>
  /**
   * The driver that ran the build, for reading plugin metadata (telemetry) or the file manager.
   */
  driver: KubbDriver
  /**
   * The storage backend the build wrote to, for reading a generated file back.
   */
  storage: Storage
  /**
   * The start time used for this run, so a host computes elapsed time against the same origin.
   */
  hrStart: [number, number]
}

/**
 * Renders a build diagnostic through the hook bus, matching how the CLI surfaces problems: an
 * unstructured `unknown` error goes out as `kubb:error`, everything else through `Diagnostics.emit`.
 * `performance` diagnostics feed the summary, not the log, so they are skipped here.
 */
async function renderDiagnostic({ diagnostic, hooks }: { diagnostic: Diagnostic; hooks: Hookable<KubbHooks> }): Promise<void> {
  if (!Diagnostics.isProblem(diagnostic)) return

  if (diagnostic.code === Diagnostics.code.unknown) {
    await hooks.callHook('kubb:error', { error: diagnostic.cause ?? new Error(diagnostic.message) })
    return
  }

  await Diagnostics.emit(hooks, diagnostic)
}

/**
 * Runs one Kubb build and its output passes end to end, emitting the surrounding lifecycle hooks.
 * This is the sequence every host shares: create the instance, emit `kubb:generation:start`, set up,
 * build, render diagnostics, run the host's output passes, then emit `kubb:generation:end`. It never
 * throws on a build error, returning the outcome in {@link GenerationResult} so the host decides how
 * failures surface. Tool execution, telemetry, watch, and config resolution stay with the host and
 * arrive through {@link RunGenerationOptions}.
 *
 * @example
 * ```ts
 * const result = await runGeneration(config, { hooks })
 * if (!result.success) process.exitCode = 1
 * ```
 */
export async function runGeneration(config: Config, options: RunGenerationOptions): Promise<GenerationResult> {
  const { hooks, input, onPhase, runOutputPasses, onSuccess } = options
  const hrStart = options.hrStart ?? process.hrtime()

  const resolvedConfig: Config = { ...config, input: input ?? config.input }
  const kubb = createKubb(resolvedConfig, { hooks })

  await hooks.callHook('kubb:generation:start', { config: resolvedConfig })

  await onPhase?.('setup')
  await kubb.setup()

  await onPhase?.('build')
  const { files, diagnostics, driver } = await kubb.safeBuild()
  const storage = kubb.storage

  await onPhase?.('summary')

  const render = options.renderDiagnostic ?? renderDiagnostic
  for (const diagnostic of diagnostics) {
    await render({ diagnostic, hooks })
  }

  if (Diagnostics.hasError(diagnostics)) {
    await hooks.callHook('kubb:generation:end', { config: resolvedConfig, storage, diagnostics, filesCreated: files.length, status: 'failed', hrStart })
    return { success: false, files, diagnostics, driver, storage, hrStart }
  }

  const outputPath = resolve(resolvedConfig.root, resolvedConfig.output.path)
  const outputDiagnostics = runOutputPasses ? await runOutputPasses({ config: resolvedConfig, outputPath, hooks }) : []

  const finalDiagnostics = [...diagnostics, ...outputDiagnostics]
  const failed = Diagnostics.hasError(outputDiagnostics)

  if (!failed) {
    await onSuccess?.()
  }

  await hooks.callHook('kubb:generation:end', {
    config: resolvedConfig,
    storage,
    diagnostics: finalDiagnostics,
    filesCreated: files.length,
    status: failed ? 'failed' : 'success',
    hrStart,
  })

  return { success: !failed, files, diagnostics: finalDiagnostics, driver, storage, hrStart }
}
