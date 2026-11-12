import { createKubb, type CreateKubbOptions, type GenerateResult, type Kubb } from './createKubb.ts'
import { detectSharedSchemas } from './detectSharedSchemas.ts'
import { Diagnostics } from './Diagnostics.ts'
import { Hookable } from './Hookable.ts'
import type { Config, KubbHooks, UserConfig } from './types.ts'

export type GenerateAllOptions = Pick<CreateKubbOptions, 'hooks' | 'signal'> & {
  /**
   * Index of the one config to build, such as the config a watcher saw change. The others are still compared with it, so
   * it shares schemas with them, but it never empties the directory they share.
   */
  only?: number
}

/**
 * What one config of {@link generateAll} produced.
 */
export type GenerateAllResult = GenerateResult & {
  /**
   * The resolved config that was built.
   */
  config: Config
  /**
   * What the build threw outside its own diagnostics, such as a hook listener that failed. `diagnostics` holds it too.
   */
  error?: unknown
}

/**
 * One {@link Kubb} per config of a `defineConfig([...])` array, in order, each with the schemas it shares with the others.
 * With `only`, the one for that config. Call `generate()` on them one at a time, since they share the hooks.
 *
 * @example
 * ```ts
 * const [kubb] = await createKubbs(configs, { hooks, only: 0 })
 * const result = await kubb.generate()
 * ```
 */
export async function createKubbs(
  configs: Array<UserConfig>,
  { hooks = new Hookable<KubbHooks>(), signal, only }: GenerateAllOptions = {},
): Promise<Array<Kubb>> {
  const sharedByConfig = await detectSharedSchemas(configs, hooks)
  if (only === undefined) return configs.map((config, index) => createKubb(config, { hooks, signal, sharedSchemas: sharedByConfig[index] }))

  const config = configs[only]
  const detected = sharedByConfig[only]
  // The other configs are not rebuilt, so this one must not empty the directory they share.
  return config ? [createKubb(config, { hooks, signal, sharedSchemas: detected && { ...detected, clean: false } })] : []
}

/**
 * Generates every config of a `defineConfig([...])` array, one after another, and returns one result per config in order.
 * A config that fails does not stop the others: its result has `success: false`. Only an aborted `signal` rejects.
 *
 * @example
 * ```ts
 * const results = await generateAll(configs, { hooks })
 * if (results.some((result) => !result.success)) process.exitCode = 1
 * ```
 */
export async function generateAll(configs: Array<UserConfig>, options: GenerateAllOptions = {}): Promise<Array<GenerateAllResult>> {
  const results: Array<GenerateAllResult> = []
  for (const kubb of await createKubbs(configs, options)) {
    try {
      results.push({ ...(await kubb.generate()), config: kubb.config })
    } catch (error) {
      if (options.signal?.aborted) throw error
      results.push({ success: false, files: [], diagnostics: [Diagnostics.from(error)], config: kubb.config, error })
    }
  }
  return results
}
