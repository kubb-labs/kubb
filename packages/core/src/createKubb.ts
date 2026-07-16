import { resolve } from 'node:path'
import { BuildError, isPathInside } from '@internals/utils'
import type { FileNode } from '@kubb/ast'
import { HOOK_LISTENERS_PER_PLUGIN } from './constants.ts'
import { type Diagnostic, Diagnostics } from './Diagnostics.ts'
import type { Storage } from './createStorage.ts'
import { KubbDriver } from './KubbDriver.ts'
import { fsStorage } from './storages/fsStorage.ts'
import type { BuildOutput, Config, KubbHooks, UserConfig } from './types.ts'
import { Hookable } from './Hookable.ts'

function resolveConfig(userConfig: UserConfig): Config {
  return {
    ...userConfig,
    root: userConfig.root || process.cwd(),
    parsers: userConfig.parsers ?? [],
    output: {
      format: false,
      lint: false,
      defaultBanner: 'simple',
      ...userConfig.output,
    },
    storage: userConfig.storage ?? fsStorage(),
    reporters: userConfig.reporters ?? [],
    plugins: userConfig.plugins ?? [],
  }
}

export type CreateKubbOptions = {
  hooks?: Hookable<KubbHooks>
}

/**
 * A step in the generation lifecycle a host narrates. `Kubb.generate` calls `onPhase` at each one
 * so a host emits its own progress without the runner knowing about presentation.
 *
 * - `'setup'` fires before `setup()`.
 * - `'build'` fires before `safeBuild()`.
 * - `'summary'` fires once the build has produced its files and diagnostics.
 */
export type GenerationPhase = 'setup' | 'build' | 'summary'

/**
 * Host hooks for a single {@link Kubb.generate} call. Everything is optional: a host that only
 * wants the build and its diagnostics passes nothing, while the CLI wires up the output passes,
 * phase narration, and success message.
 */
export type GenerateOptions = {
  /**
   * Called before each lifecycle {@link GenerationPhase} so the host can narrate progress.
   */
  onPhase?: (phase: GenerationPhase) => void | Promise<void>
  /**
   * Runs the post-build output passes (format, lint, `postGenerate`) and returns the diagnostics
   * they produced, already emitted. Only the CLI provides it. It runs after a build with no
   * error-level diagnostics.
   */
  runOutputPasses?: (context: { config: Config; outputPath: string; hooks: Hookable<KubbHooks> }) => Promise<Array<Diagnostic>>
  /**
   * Called after a successful run, before `kubb:generation:end`, so the host emits its success
   * message where the CLI always has.
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
 * Everything a {@link Kubb.generate} call produced, for the host to map onto its own result shape
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
   * The storage backend the build wrote to.
   */
  storage: Storage
  /**
   * The start time used for this run, so a host computes elapsed time against the same origin.
   */
  hrStart: [number, number]
}

/**
 * Surfaces one build diagnostic the CLI way: an unstructured `unknown` error goes out as
 * `kubb:error`, everything else through `kubb:diagnostic`. `performance` diagnostics feed the
 * summary, not the log, so they are skipped. {@link GenerateOptions.renderDiagnostic} overrides it.
 */
async function defaultRenderDiagnostic({ diagnostic, hooks }: { diagnostic: Diagnostic; hooks: Hookable<KubbHooks> }): Promise<void> {
  if (!Diagnostics.isProblem(diagnostic)) return

  if (diagnostic.code === Diagnostics.code.unknown) {
    await hooks.callHook('kubb:error', { error: diagnostic.cause ?? new Error(diagnostic.message) })
    return
  }

  await Diagnostics.emit(hooks, diagnostic)
}

/**
 * Kubb code-generation instance bound to a single config entry. Resolves the user
 * config in the constructor, so `config` is available right away, and shares `hooks`,
 * `storage`, and `driver` across the `setup → build` lifecycle.
 *
 * `createKubb` takes a plain config object (the shape `defineConfig` produces),
 * not a fluent builder.
 *
 * Attach hook listeners to `.hooks` before calling `setup()` or `build()`.
 *
 * @example
 * ```ts
 * const kubb = createKubb(userConfig)
 * kubb.hooks.hook('kubb:plugin:end', ({ plugin, duration }) => console.log(plugin.name, duration))
 * const { files, diagnostics } = await kubb.safeBuild()
 * ```
 */
export class Kubb {
  readonly hooks: Hookable<KubbHooks>
  readonly config: Config
  #driver: KubbDriver | null = null
  #storage: Storage | null = null

  constructor(userConfig: UserConfig, options: CreateKubbOptions = {}) {
    this.config = resolveConfig(userConfig)
    this.hooks = options.hooks ?? new Hookable<KubbHooks>()
  }

  get storage(): Storage {
    if (!this.#storage) throw new Error('[kubb] setup() must be called before accessing storage')
    return this.#storage
  }

  get driver(): KubbDriver {
    if (!this.#driver) throw new Error('[kubb] setup() must be called before accessing driver')
    return this.#driver
  }

  /**
   * Initializes the driver and storage. `build()` calls this automatically.
   */
  async setup(): Promise<void> {
    const config = this.config
    const driver = new KubbDriver(config, { hooks: this.hooks })

    // Each generator a plugin registers adds a listener to the shared hooks emitter, so size the
    // ceiling to the plugin count. Without this, a multi-generator plugin set trips Node's
    // EventEmitter leak warning at the default 10.
    this.hooks.setMaxListeners(Math.max(10, config.plugins.length * HOOK_LISTENERS_PER_PLUGIN))

    if (config.output.clean) {
      const cleanPath = resolve(config.root, config.output.path)

      // clean only removes generated code. Refuse when the output resolves to the project root or
      // an ancestor of it, otherwise the wipe would delete kubb.config and every source file.
      if (isPathInside(config.root, cleanPath)) {
        throw new Diagnostics.Error({
          code: Diagnostics.code.cleanRoot,
          severity: 'error',
          message: `output.clean cannot delete "${cleanPath}" because it is the project root or a parent of it.`,
          help: 'Point `output.path` at a subdirectory such as `./src/gen` so clean only removes generated code.',
          location: { kind: 'config' },
        })
      }

      await config.storage.clear(cleanPath)
    }

    await driver.setup()

    this.#driver = driver
    this.#storage = config.storage
  }

  /**
   * Runs the full pipeline and throws on any plugin error.
   * Automatically calls `setup()` if needed.
   */
  async build(): Promise<BuildOutput> {
    const out = await this.safeBuild()
    if (Diagnostics.hasError(out.diagnostics)) {
      const errors = out.diagnostics
        .filter(Diagnostics.isProblem)
        .filter((diagnostic) => diagnostic.severity === 'error')
        .map((diagnostic) => diagnostic.cause ?? new Diagnostics.Error(diagnostic))
      throw new BuildError(`Build failed with ${errors.length} ${errors.length === 1 ? 'error' : 'errors'}`, { errors })
    }
    return out
  }

  /**
   * Runs the full pipeline and captures errors in `BuildOutput` instead of throwing.
   * Automatically calls `setup()` if needed. This is the canonical call: it never throws on
   * plugin errors, so callers stay in control of how failures surface.
   */
  async safeBuild(): Promise<BuildOutput> {
    if (!this.#driver) await this.setup()
    using self = this
    const driver = self.driver
    const storage = self.storage
    const { diagnostics } = await driver.run()

    return { diagnostics, files: driver.fileManager.files, driver, storage }
  }

  /**
   * Runs one build and its output passes end to end, emitting the surrounding `kubb:generation:*`
   * hooks. This is the sequence every host shares: emit `kubb:generation:start`, set up, build,
   * render diagnostics, run the host's output passes, then emit `kubb:generation:end`. It never
   * throws on a build error, returning the outcome in {@link GenerationResult} so the host decides
   * how failures surface. Tool execution, telemetry, and progress narration stay with the host and
   * arrive through {@link GenerateOptions}.
   *
   * @example
   * ```ts
   * const result = await createKubb(config, { hooks }).generate()
   * if (!result.success) process.exitCode = 1
   * ```
   */
  async generate(options: GenerateOptions = {}): Promise<GenerationResult> {
    const { hooks, config } = this
    const hrStart = process.hrtime()

    await hooks.callHook('kubb:generation:start', { config })

    await options.onPhase?.('setup')
    await this.setup()

    await options.onPhase?.('build')
    const { files, diagnostics, driver, storage } = await this.safeBuild()

    await options.onPhase?.('summary')

    const render = options.renderDiagnostic ?? defaultRenderDiagnostic
    for (const diagnostic of diagnostics) {
      await render({ diagnostic, hooks })
    }

    if (Diagnostics.hasError(diagnostics)) {
      await hooks.callHook('kubb:generation:end', { config, storage, diagnostics, filesCreated: files.length, status: 'failed', hrStart })
      return { success: false, files, diagnostics, driver, storage, hrStart }
    }

    const outputDiagnostics = options.runOutputPasses
      ? await options.runOutputPasses({ config, outputPath: resolve(config.root, config.output.path), hooks })
      : []

    const finalDiagnostics = [...diagnostics, ...outputDiagnostics]
    const failed = Diagnostics.hasError(outputDiagnostics)

    if (!failed) {
      await options.onSuccess?.()
    }

    await hooks.callHook('kubb:generation:end', {
      config,
      storage,
      diagnostics: finalDiagnostics,
      filesCreated: files.length,
      status: failed ? 'failed' : 'success',
      hrStart,
    })

    return { success: !failed, files, diagnostics: finalDiagnostics, driver, storage, hrStart }
  }

  dispose(): void {
    this.#driver?.dispose()
  }

  [Symbol.dispose](): void {
    this.dispose()
  }
}

/**
 * Constructs a {@link Kubb} build orchestrator from a user config. Equivalent
 * to `new Kubb(userConfig, options)` and the canonical public entry point.
 *
 * @example
 * ```ts
 * import { createKubb } from '@kubb/core'
 * import { adapterOas } from '@kubb/adapter-oas'
 * import { pluginTs } from '@kubb/plugin-ts'
 *
 * const kubb = createKubb({
 *   input: './petStore.yaml',
 *   output: { path: './src/gen' },
 *   adapter: adapterOas(),
 *   plugins: [pluginTs()],
 * })
 *
 * await kubb.build()
 * ```
 */
export function createKubb(userConfig: UserConfig, options: CreateKubbOptions = {}): Kubb {
  return new Kubb(userConfig, options)
}
