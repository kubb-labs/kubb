import { resolve } from 'node:path'
import { BuildError, isPathInside } from '@internals/utils'
import { HOOK_LISTENERS_PER_PLUGIN } from './constants.ts'
import { Diagnostics } from './Diagnostics.ts'
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
        throw new Error(
          `[kubb] output.clean refuses to delete "${cleanPath}" because it is the project root or a parent of it, which would remove kubb.config and your source files. Point output.path at a subdirectory such as "./src/gen" so clean only removes generated code.`,
        )
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
