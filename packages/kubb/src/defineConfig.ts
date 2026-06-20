import type { ConfigInput } from '@kubb/core'

/**
 * Helper for defining a Kubb configuration.
 *
 * Importing `defineConfig` from `kubb` is the recommended entrypoint as of v5.
 * The `kubb` package wires up the OpenAPI [adapter](https://kubb.dev/docs/5.x/concepts/adapters),
 * the TypeScript [parsers](https://kubb.dev/docs/5.x/concepts/parsers), and the
 * barrel [plugin](https://kubb.dev/plugins/plugin-barrel) for you.
 *
 * Accepts either:
 * - A config object or array of configs
 * - A function returning the config(s), optionally async,
 *   receiving the CLI options as argument
 *
 * @example
 * import { defineConfig } from 'kubb'
 *
 * export default defineConfig({
 *   input: { path: './petStore.yaml' },
 *   output: { path: './src/gen' },
 *   plugins: [pluginTs()],
 * })
 */
export function defineConfig<TConfig extends ConfigInput>(config: TConfig): TConfig {
  return config
}
