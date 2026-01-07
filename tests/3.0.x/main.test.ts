import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type KubbEvents, safeBuild } from '@kubb/core'
import { getRelativePath } from '@kubb/core/fs'
import { AsyncEventEmitter } from '@kubb/core/utils'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginTs } from '@kubb/plugin-ts'
import { describe, expect, test } from 'vitest'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const version = '3.0.x'

describe(`OpenAPI ${version}`, () => {
  const configs = [
    {
      name: 'simple',
      config: defineConfig({
        root: __dirname,
        input: {
          path: '../../schemas/3.0.x/petStore.yaml',
        },
        output: {
          path: './gen',
          clean: true,
          barrelType: false,
        },
        plugins: [pluginOas({ validate: false }), pluginTs({ output: { path: './types', barrelType: false } })],
      }),
    },
  ]

  test.each(configs)('config testing with config as $name', async ({ name, config }) => {
    const output = path.join(__dirname, 'gen', name)
    const { files, failedPlugins, error } = await safeBuild({
      config: {
        ...config,
        output: {
          ...config.output,
          path: `./gen/${name}`,
        },
      },
      events: new AsyncEventEmitter<KubbEvents>(),
    })

    expect(files.length).toBeGreaterThan(1)
    expect(failedPlugins.size).toBe(0)
    expect(error).toBeUndefined()

    await Promise.all(
      files.map(async (file) => {
        const fileContent = await fs.readFile(file.path, 'utf-8')
        await expect(fileContent).toMatchFileSnapshot(path.join(__dirname, '__snapshots__', name, getRelativePath(output, file.path)))
      }),
    )

    await fs.rm(output, { recursive: true, force: true })
  })
})
