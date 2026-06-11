import { resolve } from 'node:path'
import { AsyncEventEmitter, BuildError } from '@internals/utils'
import { HOOK_LISTENERS_PER_PLUGIN } from './constants.ts'
import { Diagnostics } from './diagnostics.ts'
import { createStorage, type Storage } from './createStorage.ts'
import { KubbDriver } from './KubbDriver.ts'
import { fsStorage } from './storages/fsStorage.ts'
import type { BuildOutput, Config, KubbHooks, UserConfig } from './types.ts'

/**
 * Builds a `Storage` view scoped to the file paths produced by the current build.
 * Reads delegate to the underlying `storage` so source bytes stay where they were
 * written. Writes register the key so subsequent reads and `getKeys` are scoped
 * to this build's output.
 */
function createSourcesView(storage: Storage): Storage {
  const paths = new Set<string>()

  return createStorage(() => ({
    name: `${storage.name}:sources`,
    async hasItem(key: string) {
      return paths.has(key) && (await storage.hasItem(key))
    },
    async getItem(key: string) {
      return paths.has(key) ? storage.getItem(key) : null
    },
    async setItem(key: string, value: string) {
      paths.add(key)
      await storage.setItem(key, value)
    },
    async removeItem(key: string) {
      paths.delete(key)
      await storage.removeItem(key)
    },
    async getKeys(base?: string) {
      if (!base) return [...paths]
      const result: Array<string> = []
      for (const key of paths) {
        if (key.startsWith(base)) result.push(key)
      }
      return result
    },
    async clear() {
      paths.clear()
      await storage.clear()
    },
  }))()
}

function resolveConfig(userConfig: UserConfig): Config {
  return {
    ...userConfig,
    root: userConfig.root || process.cwd(),
    parsers: userConfig.parsers ?? [],
    output: {
      format: false,
      lint: false,
      extension: { '.ts': '.ts' },
      defaultBanner: 'simple',
      ...userConfig.output,
    },
    storage: userConfig.storage ?? fsStorage(),
    // Resolve `false` to "no cache". The default `fsCache()` is applied by `defineConfig`, not here,
    // so a raw `createKubb` stays deterministic (no surprise on-disk cache) unless a cache is passed.
    cache: userConfig.cache === false ? undefined : userConfig.cache,
    reporters: userConfig.reporters ?? [],
    plugins: userConfig.plugins ?? [],
  }
}

type CreateKubbOptions = {
  hooks?: AsyncEventEmitter<KubbHooks>
}

/**
 * Kubb code-generation instance bound to a single config entry. Resolves the user
 * config in the constructor, so `config` is available right away, and shares `hooks`,
 * `storage`, and `driver` across the `setup → build` lifecycle.
 *
 * `createKubb` takes a plain, serializable config object (the shape `defineConfig`
 * produces), not a fluent builder. Config stays plain data so it can be cache
 * fingerprinted and validated against the shipped JSON schema.
 *
 * Attach event listeners to `.hooks` before calling `setup()` or `build()`.
 *
 * @example
 * ```ts
 * const kubb = createKubb(userConfig)
 * kubb.hooks.on('kubb:plugin:end', ({ plugin, duration }) => console.log(plugin.name, duration))
 * const { files, diagnostics } = await kubb.safeBuild()
 * ```
 */
export class Kubb {
  readonly hooks: AsyncEventEmitter<KubbHooks>
  readonly config: Config
  #driver: KubbDriver | null = null
  #storage: Storage | null = null

  constructor(userConfig: UserConfig, options: CreateKubbOptions = {}) {
    this.config = resolveConfig(userConfig)
    this.hooks = options.hooks ?? new AsyncEventEmitter<KubbHooks>()
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
    const storage = createSourcesView(config.storage)

    // Each generator a plugin registers adds a listener to the shared hooks emitter, so size the
    // ceiling to the plugin count. Without this, a multi-generator plugin set trips Node's
    // EventEmitter leak warning at the default 10.
    this.hooks.setMaxListeners(Math.max(10, config.plugins.length * HOOK_LISTENERS_PER_PLUGIN))

    if (config.output.clean) {
      await config.storage.clear(resolve(config.root, config.output.path))
    }

    await driver.setup()

    this.#driver = driver
    this.#storage = storage
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
    using cleanup = this
    const driver = cleanup.driver
    const storage = cleanup.storage
    const { diagnostics } = await driver.run({ storage })

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
 *   input: { path: './petStore.yaml' },
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
