import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { createCompiler, Logger, resolveConfig } from '@farmfe/core'
import { ast } from '@kubb/ast'
import { createMockedAdapter } from '@kubb/core/mocks'
import { defineExtension, memoryStorage, type Storage, type UserConfig } from '@kubb/core'
import { rspack } from '@rspack/core'
import { build as esbuild } from 'esbuild'
import { rolldown } from 'rolldown'
import { rollup } from 'rollup'
import { build as vite } from 'vite'
import webpack from 'webpack'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import esbuildPlugin from './esbuild.ts'
import farmPlugin from './farm.ts'
import rolldownPlugin from './rolldown.ts'
import rollupPlugin from './rollup.ts'
import rspackPlugin from './rspack.ts'
import { createSchemaPlugin, schemaAdapter } from './__mocks__/schemaPlugin.ts'
import type { Options } from './unpluginFactory.ts'
import vitePlugin from './vite.ts'
import webpackPlugin from './webpack.ts'

type BuildParams = {
  options: Options
  root: string
  entry: string
}

type Bundler = {
  name: string
  build: (params: BuildParams) => Promise<void>
}

type Compiler = {
  run(callback: (error: Error | null, stats?: { hasErrors(): boolean; toString(preset: 'errors-only'): string }) => void): void
  close(callback: () => void): void
}

/**
 * Runs a webpack-compatible compiler once and rejects on fatal or compilation errors.
 */
function compile(compiler: Compiler): Promise<void> {
  return new Promise((resolve, reject) => {
    compiler.run((error, stats) => {
      compiler.close(() => {
        if (error) return reject(error)
        if (stats?.hasErrors()) return reject(new Error(stats.toString('errors-only')))
        resolve()
      })
    })
  })
}

const bundlers: Array<Bundler> = [
  {
    name: 'vite',
    async build({ options, root, entry }) {
      await vite({
        root,
        configFile: false,
        logLevel: 'silent',
        build: { outDir: 'dist/vite', lib: { entry, formats: ['es'], fileName: 'index' } },
        plugins: [vitePlugin(options)],
      })
    },
  },
  {
    name: 'rollup',
    async build({ options, entry }) {
      const bundle = await rollup({ input: entry, plugins: [rollupPlugin(options)] })
      await bundle.close()
    },
  },
  {
    name: 'rolldown',
    async build({ options, entry }) {
      const bundle = await rolldown({ input: entry, plugins: [rolldownPlugin(options)] })
      try {
        await bundle.generate()
      } finally {
        await bundle.close()
      }
    },
  },
  {
    name: 'esbuild',
    async build({ options, entry }) {
      await esbuild({ entryPoints: [entry], bundle: true, write: false, logLevel: 'silent', plugins: [esbuildPlugin(options)] })
    },
  },
  {
    name: 'webpack',
    async build({ options, root, entry }) {
      await compile(webpack({ mode: 'production', context: root, entry, output: { path: path.join(root, 'dist/webpack') }, plugins: [webpackPlugin(options)] }))
    },
  },
  {
    name: 'rspack',
    async build({ options, root, entry }) {
      await compile(rspack({ mode: 'production', context: root, entry, output: { path: path.join(root, 'dist/rspack') }, plugins: [rspackPlugin(options)] }))
    },
  },
  {
    // Farm's `build` exits the process on failure, so drive its compiler directly.
    name: 'farm',
    async build({ options, root, entry }) {
      const logger = new Logger()
      const config = await resolveConfig(
        {
          root,
          compilation: { input: { index: entry }, output: { path: 'dist/farm', targetEnv: 'node' }, persistentCache: false },
          plugins: [farmPlugin(options)],
        },
        'production',
        logger,
        false,
      )
      const compiler = await createCompiler(config, logger)
      await compiler.compile()
    },
  },
]

function createConfig({ root, storage, fail = false }: { root: string; storage: Storage; fail?: boolean }): UserConfig {
  const plugin = defineExtension({
    kind: 'plugin',
    meta: { name: 'plugin' },
    hooks: {
      'kubb:plugin:setup'(ctx) {
        if (fail) throw new Error('setup failed')

        ctx.injectFile(
          ast.factory.createFile({
            path: path.join(root, 'gen/pet.ts'),
            baseName: 'pet.ts',
            sources: [ast.factory.createSource({ nodes: [ast.factory.createText('export type Pet = { id: number }')] })],
          }),
        )
      },
    },
  })()

  return {
    root,
    input: 'https://example.com/openapi.json',
    output: { path: './gen' },
    adapter: createMockedAdapter(),
    plugins: [plugin],
    storage,
  }
}

describe.each(bundlers)('$name', ({ build }) => {
  let root = ''
  let entry = ''

  beforeAll(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'unplugin-kubb-'))
    entry = path.join(root, 'index.js')
    await fs.writeFile(entry, 'export const value = 1\n')
  })

  afterAll(async () => {
    await fs.rm(root, { recursive: true, force: true })
  })

  test('generates the files during a build', async () => {
    const storage = memoryStorage()

    await build({ options: { config: createConfig({ root, storage }) }, root, entry })

    const keys = await storage.readKeys()
    expect(keys).toHaveLength(1)
    expect(await storage.readItem(keys[0] ?? '')).toContain('export type Pet')
  })

  test('loads an imported spec as a module of every plugin output', async () => {
    // Parsed as JavaScript, this YAML is a syntax error, so the build only passes when the loader ran.
    await fs.writeFile(path.join(root, 'pet.openapi.yaml'), 'openapi: 3.0.0\n')
    const importEntry = path.join(root, 'import.js')
    // Plugin a's type is erased, so import a value from each plugin to prove both reached the module.
    await fs.writeFile(importEntry, "import { a_PetValue, b_Pet } from './pet.openapi.yaml'\nexport const pets = [a_PetValue, b_Pet]\n")
    const config: UserConfig = { output: { path: './gen' }, adapter: schemaAdapter, plugins: [createSchemaPlugin('a'), createSchemaPlugin('b', 'a')] }

    await expect(build({ options: { config }, root, entry: importEntry })).resolves.toBeUndefined()
  })

  test('fails the build when generation fails', async () => {
    const options = { config: createConfig({ root, storage: memoryStorage(), fail: true }) }

    await expect(build({ options, root, entry })).rejects.toThrow('[unplugin-kubb]')
  })
})
