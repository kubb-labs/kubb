import { adapterOas } from '@kubb/adapter-oas'
import { registerConfigPreset } from '@kubb/core'
import { parserTs } from '@kubb/parser-ts'
import { pluginTs } from '@kubb/plugin-ts'

/**
 * Built-in `'oas-typescript'` config preset.
 *
 * Bundles:
 * - **adapter** – `adapterOas()` (OpenAPI/Swagger spec parser)
 * - **parsers** – `parserTs` (TypeScript source printer)
 * - **plugins** – `pluginTs()` (TypeScript type generation)
 *
 * @example
 * ```ts
 * import { defineConfig } from '@kubb/core'
 *
 * export default defineConfig({
 *   input:  { path: './petStore.yaml' },
 *   output: { path: './src/gen', clean: true },
 *   configPreset: 'oas-typescript',
 *   // Override any plugin option — this pluginTs wins over the preset's default:
 *   plugins: [pluginTs({ enumType: 'asConst' })],
 * })
 * ```
 */
registerConfigPreset({
  name: 'oas-typescript',
  adapter: adapterOas(),
  parsers: [parserTs],
  plugins: [pluginTs()],
})
