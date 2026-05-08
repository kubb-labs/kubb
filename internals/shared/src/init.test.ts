import { describe, expect, it } from 'vitest'
import { availablePlugins } from './constants.ts'
import { generateConfigFile } from './init.ts'

describe('generateConfigFile', () => {
  it('generates a config with a single plugin', () => {
    const [pluginTs] = availablePlugins
    const result = generateConfigFile([pluginTs], './openapi.yaml', './src/gen')
    expect(result).toContain("import { pluginTs } from '@kubb/plugin-ts'")
    expect(result).toContain("path: './openapi.yaml'")
    expect(result).toContain("path: './src/gen'")
    expect(result).toContain('pluginTs(')
  })

  it('generates imports for every selected plugin', () => {
    const selected = availablePlugins.filter((p) => ['plugin-ts', 'plugin-zod'].includes(p.value))
    const result = generateConfigFile(selected, './spec.json', './out')
    expect(result).toContain("import { pluginTs } from '@kubb/plugin-ts'")
    expect(result).toContain("import { pluginZod } from '@kubb/plugin-zod'")
  })

  it('falls back to importName() call for an unknown plugin value', () => {
    const unknown = {
      value: 'plugin-unknown',
      label: 'Unknown',
      packageName: '@kubb/plugin-unknown',
      importName: 'pluginUnknown',
      category: 'types' as const,
    }
    const result = generateConfigFile([unknown], './a.yaml', './b')
    expect(result).toContain('pluginUnknown()')
  })

  it('produces a valid ESM default export', () => {
    const [pluginTs] = availablePlugins
    const result = generateConfigFile([pluginTs], './api.yaml', './gen')
    expect(result).toMatch(/^import \{ defineConfig \} from 'kubb'/)
    expect(result).toContain('export default defineConfig({')
  })

  it('handles an empty plugin list', () => {
    const result = generateConfigFile([], './api.yaml', './gen')
    expect(result).toContain('plugins: [')
    expect(result).not.toContain("from '@kubb/")
  })
})
