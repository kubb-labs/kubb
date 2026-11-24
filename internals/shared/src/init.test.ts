import { describe, expect, it } from 'vitest'
import { readConfig } from './editor/configFile.ts'
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

  it('escapes quotes and backslashes so a path cannot break out of the string', () => {
    const inputPath = "./a'b.yaml', plugins: [require('node:child_process')], x: '"
    const outputPath = 'C:\\new\\gen'
    const source = generateConfigFile({ inputPath, outputPath })

    expect(source).toContain(String.raw`input: './a\'b.yaml\', plugins: [require(\'node:child_process\')], x: \'',`)
    expect(source).toContain(String.raw`path: 'C:\\new\\gen',`)
    expect(readConfig(source)).toMatchObject({ managed: true, configs: [{ plugins: [] }] })
  })
})
