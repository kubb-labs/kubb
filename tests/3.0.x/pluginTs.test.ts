import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { AsyncEventEmitter, getRelativePath } from '@internals/utils'
import { adapterOas } from '@kubb/adapter-oas'
import { createKubb, type KubbHooks, type UserConfig } from '@kubb/core'
import { parserTs } from '@kubb/parser-ts'
import { pluginTs } from '@kubb/plugin-ts'
import { describe, expect, test } from 'vitest'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const version = '3.0.x'

const configs: Array<{ name: string; config: UserConfig }> = [
  // ─── group ───────────────────────────────────────────────────────────────
  {
    /**
     * Regression: operations with no tags + operationIds containing
     * version-like dots (e.g. v2025.0) that should not be split into path segments.
     */
    name: 'noTagsDotOperationId',
    config: {
      root: __dirname,
      input: { path: '../../schemas/3.0.x/noTagsDotOperationId.yaml' },
      output: { path: './gen', barrelType: false },
      adapter: adapterOas({ validate: false }),
      parsers: [parserTs],
      plugins: [
        pluginTs({
          output: { path: './types', barrelType: false },
          group: { type: 'tag' },
        }),
      ],
    },
  },

  // ─── exclude / include ───────────────────────────────────────────────────
  {
    name: 'excludeByOperationId',
    config: {
      root: __dirname,
      input: { path: '../../schemas/3.0.x/petStore.yaml' },
      output: { path: './gen', barrelType: false },
      adapter: adapterOas({ validate: false }),
      parsers: [parserTs],
      plugins: [
        pluginTs({
          output: { path: './types', barrelType: false },
          exclude: [
            { type: 'operationId', pattern: 'addPet' },
            { type: 'operationId', pattern: 'deletePet' },
          ],
        }),
      ],
    },
  },
  {
    name: 'includeByTag',
    config: {
      root: __dirname,
      input: { path: '../../schemas/3.0.x/petStore.yaml' },
      output: { path: './gen', barrelType: false },
      adapter: adapterOas({ validate: false }),
      parsers: [parserTs],
      plugins: [
        pluginTs({
          output: { path: './types', barrelType: false },
          include: [{ type: 'tag', pattern: 'pet' }],
        }),
      ],
    },
  },
]

describe(`plugin-ts options ${version}`, () => {
  test.each(configs)('config testing with config as $name', async ({ name, config }) => {
    const tmpDir = path.join(os.tmpdir(), `kubb-test-${name}-${Date.now()}`)
    const output = path.join(tmpDir, name)
    const { files, failedPlugins, error } = await createKubb({
      config: {
        ...config,
        output: {
          ...config.output,
          path: output,
        },
      },
      hooks: new AsyncEventEmitter<KubbHooks>(),
    }).safeBuild()

    expect(files.length).toBeGreaterThan(0)
    expect(failedPlugins.size).toBe(0)
    expect(error).toBeUndefined()

    for (const file of files) {
      const fileContent = await fs.readFile(file.path, 'utf-8')
      await expect(fileContent).toMatchFileSnapshot(path.join(__dirname, '__snapshots__', 'pluginTs', name, getRelativePath(output, file.path)))
    }

    await fs.rm(tmpDir, { recursive: true, force: true })
  })
})
