import { describe, expect, it } from 'vitest'
import { generateConfigFile } from './init.ts'

describe('generateConfigFile', () => {
  it('generates a config with the given paths and no plugins', () => {
    expect(generateConfigFile({ inputPath: './openapi.yaml', outputPath: './src/gen' })).toMatchInlineSnapshot(`
      "import { defineConfig } from 'kubb/config'

      export default defineConfig({
        input: './openapi.yaml',
        output: {
          path: './src/gen',
          clean: true,
        },
        plugins: [],
      })
      "
    `)
  })
})
