import { resolve } from 'node:path'
import { isPathInside } from '@internals/utils'
import type { FileNode } from '@kubb/ast'
import { type Diagnostic, Diagnostics } from './Diagnostics.ts'
import type { Storage } from './createStorage.ts'
import { detectSharedSchemas, type SharedSchemas } from './detectSharedSchemas.ts'
import { KubbDriver } from './KubbDriver.ts'
import { createOutputManifest, type OutputManifest } from './outputManifest.ts'
import { cacheStorage } from './storages/cacheStorage.ts'
import { fsStorage } from './storages/fsStorage.ts'
import type { BuildOutput, Config, KubbHooks, UserConfig } from './types.ts'
import { Hookable } from './Hookable.ts'
import { runOutputPasses, type RunOutputPassesOptions } from './output/runOutputPasses.ts'

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

/**
 * Only the fs storage writes `output.path`, so only then do the passes have fresh files to run
 * over; a memory or custom storage would leave them formatting whatever an earlier run left there.
 */
function writesOutputDirectory(storage: Storage): boolean {
  return storage.name === 'fs'
}

/**
 * Whether anything runs over the output directory after the files are written. Only then can the
 * bytes on disk stop matching what Kubb wrote, which is what the manifest exists to track.
 */
export function hasOutputPasses({ output, storage }: Pick<Config, 'output' | 'storage'>): boolean {
  return writesOutputDirectory(storage) && Boolean(output.format || output.lint || output.postGenerate?.length)
}

export type CreateKubbOptions = {
  /**
   * Receives Kubb lifecycle hooks for the run.
   */
  hooks?: Hookable<KubbHooks>
  /**
   * Stops the build at the next safe checkpoint.
   */
  signal?: AbortSignal
  /**
   * This config's entry from {@link detectSharedSchemas}. Without it the build shares nothing.
   */
  sharedSchemas?: SharedSchemas
}

export type FromConfigsOptions = Pick<CreateKubbOptions, 'hooks' | 'signal'> & {
  /** Index of the one config to build. It is still compared with the others, but never empties the directory they share. */
  only?: number
}

export type ConfigGenerateResult = GenerateResult & {
  /** The instance that built this config, to read its `config`, `storage` or `hooks`, or to build it again. */
  kubb: Kubb
  /** What the build threw outside its own diagnostics. `diagnostics` holds it too. */
  error?: unknown
}

/**
 * Host hooks for a single {@link Kubb#generate} call. All optional. Progress narration rides the
 * `kubb:*` lifecycle hooks on `.hooks`, so hosts subscribe there rather than pass a callback.
 */
export type GenerateOptions = {
  /**
   * Replaces the output passes that run after an error-free build. The default,
   * {@link runOutputPasses}, formats, lints and runs `output.postGenerate` over the generated
   * output and returns the diagnostics they emitted.
   */
  processOutput?: (context: RunOutputPassesOptions) => Promise<Array<Diagnostic>>
}

/**
 * What a {@link Kubb#generate} call produced, for the host to map onto its own result shape.
 */
export type GenerateResult = {
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
  #manifest: OutputManifest | null = null
  readonly #signal: AbortSignal | undefined
  readonly #sharedSchemas: SharedSchemas | undefined

  constructor(userConfig: UserConfig, options: CreateKubbOptions = {}) {
    this.config = resolveConfig(userConfig)
    this.hooks = options.hooks ?? new Hookable<KubbHooks>()
    this.#signal = options.signal
    this.#sharedSchemas = options.sharedSchemas
  }

  /**
   * One {@link Kubb} per config of a `defineConfig([...])` array, in order, each with the schemas it shares with the others.
   * With `only`, the one for that config. Call `generate()` on them one at a time, since they share the hooks.
   */
  static async fromConfigs(configs: Array<UserConfig>, { hooks = new Hookable<KubbHooks>(), signal, only }: FromConfigsOptions = {}): Promise<Array<Kubb>> {
    const sharedByConfig = await detectSharedSchemas(configs, hooks)
    if (only === undefined) return configs.map((config, index) => new Kubb(config, { hooks, signal, sharedSchemas: sharedByConfig[index] }))

    const config = configs[only]
    const detected = sharedByConfig[only]
    return config ? [new Kubb(config, { hooks, signal, sharedSchemas: detected && { ...detected, clean: false } })] : []
  }

  /**
   * Generates every config of a `defineConfig([...])` array, one after another, and returns one result per config in order.
   * A config that fails does not stop the others: its result has `success: false`. Only an aborted `signal` rejects.
   */
  static async generate(configs: Array<UserConfig>, options: FromConfigsOptions = {}): Promise<Array<ConfigGenerateResult>> {
    const results: Array<ConfigGenerateResult> = []
    for (const kubb of await Kubb.fromConfigs(configs, options)) {
      try {
        results.push({ ...(await kubb.generate()), kubb })
      } catch (error) {
        if (options.signal?.aborted) throw error
        results.push({ success: false, files: [], diagnostics: [Diagnostics.from(error)], kubb, error })
      }
    }
    return results
  }

  get storage(): Storage {
    return this.config.storage
  }

  get driver(): KubbDriver {
    if (!this.#driver)
      throw new Diagnostics.Error({ code: Diagnostics.code.internalError, severity: 'error', message: '[kubb] setup() must be called before accessing driver' })
    return this.#driver
  }

  /**
   * Initializes the driver and storage. `build()` calls this automatically.
   */
  async setup(): Promise<void> {
    const signal = this.#signal
    signal?.throwIfAborted()
    const config = this.config
    const manifest = hasOutputPasses(config) ? await createOutputManifest({ storage: config.storage, cache: cacheStorage({ root: config.root }) }) : undefined

    const dirsToClean: Array<[option: string, dir: string]> = []
    if (config.output.clean) dirsToClean.push(['output.path', resolve(config.root, config.output.path)])
    if (config.shared && this.#sharedSchemas?.clean) dirsToClean.push(['shared.path', resolve(config.root, config.shared.path)])

    // clean only removes generated code. Refuse when the output resolves to the project root or
    // an ancestor of it, otherwise the wipe would delete kubb.config and every source file.
    for (const [option, dir] of dirsToClean) {
      if (!isPathInside(config.root, dir)) continue
      throw new Diagnostics.Error({
        code: Diagnostics.code.cleanRoot,
        severity: 'error',
        message: `output.clean cannot delete "${dir}" because it is the project root or a parent of it.`,
        help: `Point \`${option}\` at a subdirectory such as \`./src/gen\` so clean only removes generated code.`,
        location: { kind: 'config' },
      })
    }

    // The driver empties `cleanPaths` right before it writes the new files, so a run that fails
    // earlier, on an invalid spec or a plugin that throws, leaves the previous output in place.
    const driver = new KubbDriver(config, {
      hooks: this.hooks,
      manifest,
      signal,
      cleanPaths: dirsToClean.map(([, dir]) => dir),
      sharedSchemas: this.#sharedSchemas,
    })
    await driver.setup()

    this.#driver = driver
    this.#manifest = manifest ?? null
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
      throw new AggregateError(errors, `Build failed with ${errors.length} ${errors.length === 1 ? 'error' : 'errors'}`)
    }
    return out
  }

  /**
   * Runs the full pipeline and captures errors in `BuildOutput` instead of throwing.
   * Automatically calls `setup()` if needed. This is the canonical call: it never throws on
   * plugin errors, so callers stay in control of how failures surface.
   */
  async safeBuild(): Promise<BuildOutput> {
    this.#signal?.throwIfAborted()
    if (!this.#driver) await this.setup()
    using self = this
    const driver = self.driver
    const storage = self.storage
    const { diagnostics } = await driver.run()

    return { diagnostics, files: driver.fileManager.files, driver, storage }
  }

  /**
   * Run one build and its output passes end to end, emitting the surrounding `kubb:generation:*`
   * hooks. Never throws on a build error: the outcome comes back in {@link GenerateResult} so the
   * host decides how failures surface. Telemetry and progress narration stay with the host, which
   * reads the result and subscribes to the `kubb:*` hooks.
   *
   * @example
   * ```ts
   * const result = await createKubb(config, { hooks }).generate()
   * if (!result.success) process.exitCode = 1
   * ```
   */
  async generate(options: GenerateOptions = {}): Promise<GenerateResult> {
    const signal = this.#signal
    signal?.throwIfAborted()
    const { hooks, config } = this
    const hrStart = process.hrtime()

    await hooks.callHook('kubb:generation:start', { config })

    // A setup failure, such as an invalid plugin entry, becomes a diagnostic like any build
    // problem, so reporters still get a failed `kubb:generation:end` for this config.
    let output: Pick<BuildOutput, 'files' | 'diagnostics'>
    try {
      await hooks.callHook('kubb:setup:start')
      await this.setup()
      await hooks.callHook('kubb:setup:end')

      output = await this.safeBuild()
    } catch (caughtError) {
      if (signal?.aborted) throw caughtError
      output = { files: [], diagnostics: [Diagnostics.from(caughtError)] }
    }
    const { files, diagnostics } = output
    const storage = this.storage
    signal?.throwIfAborted()

    // Surface every problem on the hooks. `performance` diagnostics feed the summary, not the
    // log, so they are skipped.
    for (const diagnostic of diagnostics) {
      if (Diagnostics.isProblem(diagnostic)) await Diagnostics.emit(hooks, diagnostic)
    }

    if (Diagnostics.hasError(diagnostics)) {
      await hooks.callHook('kubb:generation:end', { config, storage, diagnostics, filesCreated: files.length, status: 'failed', hrStart })
      return { success: false, files, diagnostics }
    }

    const processOutput = options.processOutput ?? runOutputPasses
    const outputDiagnostics = writesOutputDirectory(config.storage)
      ? await processOutput({ config, outputPath: resolve(config.root, config.output.path), hooks, signal })
      : []

    const finalDiagnostics = [...diagnostics, ...outputDiagnostics]
    const failed = Diagnostics.hasError(outputDiagnostics)

    // The formatter and linter have had their turn, so what sits on disk now is what the next run
    // has to recognize as unchanged. Only record it when they finished: a pass that failed halfway
    // leaves files Kubb has to stay free to regenerate.
    if (!failed) await this.#manifest?.commit()

    await hooks.callHook('kubb:generation:end', {
      config,
      storage,
      diagnostics: finalDiagnostics,
      filesCreated: files.length,
      status: failed ? 'failed' : 'success',
      hrStart,
    })

    return { success: !failed, files, diagnostics: finalDiagnostics }
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
