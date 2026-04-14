import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { AsyncEventEmitter, getRelativePath } from '@internals/utils'
import { adapterOas } from '@kubb/adapter-oas'
import { type KubbHooks, safeBuild, type UserConfig } from '@kubb/core'
import { parserTs } from '@kubb/parser-ts'
import { pluginZod } from '@kubb/plugin-zod'
import { describe, expect, test } from 'vitest'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const version = '3.0.x'

const configs: Array<{ name: string; config: UserConfig }> = [
  // ─── basic ──────────────────────────────────────────────────────────────
  {
    name: 'petStore',
    config: {
      root: __dirname,
      input: { path: '../../schemas/3.0.x/petStore.yaml' },
      output: { path: './gen', barrelType: false },
      adapter: adapterOas({ validate: false }),
      parsers: [parserTs],
      plugins: [
        pluginZod({
          output: { path: './zod', barrelType: false },
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
        pluginZod({
          output: { path: './zod', barrelType: false },
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
        pluginZod({
          output: { path: './zod', barrelType: false },
          include: [{ type: 'tag', pattern: 'pet' }],
        }),
      ],
    },
  },
  // ─── group ──────────────────────────────────────────────────────────────
  {
    name: 'groupByTag',
    config: {
      root: __dirname,
      input: { path: '../../schemas/3.0.x/petStore.yaml' },
      output: { path: './gen', barrelType: false },
      adapter: adapterOas({ validate: false }),
      parsers: [parserTs],
      plugins: [
        pluginZod({
          output: { path: './zod', barrelType: false },
          group: { type: 'tag' },
        }),
      ],
    },
  },
  // ─── inferred ───────────────────────────────────────────────────────────
  {
    name: 'inferred',
    config: {
      root: __dirname,
      input: { path: '../../schemas/3.0.x/petStore.yaml' },
      output: { path: './gen', barrelType: false },
      adapter: adapterOas({ validate: false }),
      parsers: [parserTs],
      plugins: [
        pluginZod({
          output: { path: './zod', barrelType: false },
          inferred: true,
        }),
      ],
    },
  },
  // ─── coercion ───────────────────────────────────────────────────────────
  {
    name: 'coercion',
    config: {
      root: __dirname,
      input: { path: '../../schemas/3.0.x/petStore.yaml' },
      output: { path: './gen', barrelType: false },
      adapter: adapterOas({ validate: false }),
      parsers: [parserTs],
      plugins: [
        pluginZod({
          output: { path: './zod', barrelType: false },
          coercion: true,
        }),
      ],
    },
  },
  // ─── dateType ───────────────────────────────────────────────────────────
  {
    name: 'dateTypeDate',
    config: {
      root: __dirname,
      input: { path: '../../schemas/3.0.x/petStore.yaml' },
      output: { path: './gen', barrelType: false },
      adapter: adapterOas({ validate: false }),
      parsers: [parserTs],
      plugins: [
        pluginZod({
          output: { path: './zod', barrelType: false },
          dateType: 'date',
        }),
      ],
    },
  },
  // ─── paramsCasing ──────────────────────────────────────────────────────
  {
    name: 'paramsCasing',
    config: {
      root: __dirname,
      input: { path: '../../schemas/3.0.x/paramsCasing.yaml' },
      output: { path: './gen', barrelType: false },
      adapter: adapterOas({ validate: false }),
      parsers: [parserTs],
      plugins: [
        pluginZod({
          output: { path: './zod', barrelType: false },
          paramsCasing: 'camelcase',
        }),
      ],
    },
  },
]

describe(`plugin-zod options ${version}`, () => {
  test.each(configs)('config testing with config as $name', async ({ name, config }) => {
    const tmpDir = path.join(os.tmpdir(), `kubb-test-${name}-${Date.now()}`)
    const output = path.join(tmpDir, name)
    const { files, failedPlugins, error } = await safeBuild({
      config: {
        ...config,
        output: {
          ...config.output,
          path: output,
        },
      },
      hooks: new AsyncEventEmitter<KubbHooks>(),
    })

    expect(files.length).toBeGreaterThan(0)
    expect(failedPlugins.size).toBe(0)
    expect(error).toBeUndefined()

    for (const file of files) {
      const fileContent = await fs.readFile(file.path, 'utf-8')
      await expect(fileContent).toMatchFileSnapshot(path.join(__dirname, '__snapshots__', 'pluginZod', name, getRelativePath(output, file.path)))
    }

    await fs.rm(tmpDir, { recursive: true, force: true })
  })
})
