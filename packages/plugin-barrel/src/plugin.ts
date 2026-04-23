import { dirname, resolve } from 'node:path'
import { getRelativePath } from '@internals/utils'
import type { FileNode } from '@kubb/ast'
import { createExport, createFile } from '@kubb/ast'
import { BARREL_FILENAME, definePlugin, getBarrelFiles } from '@kubb/core'
import type { BarrelType, NormalizedPlugin } from '@kubb/core'
import type { PluginBarrel, PluginBarrelOptions } from './types.ts'
import { pluginBarrelName } from './types.ts'

/**
 * Barrel-file generation plugin.
 *
 * Owns all barrel generation logic — core has zero awareness of this plugin.
 * Must be listed **last** in the plugins array so that, when its own
 * `kubb:plugin:end` fires, every other plugin has already deposited its
 * files into the file manager (required for a complete root barrel).
 *
 * - `kubb:plugin:setup`: persists the resolved options.
 * - `kubb:build:start`: captures lazy references to `getFiles` and `upsertFile`
 *   from the shared driver so they can be called during `kubb:plugin:end`.
 * - `kubb:plugin:end`:
 *   - For every other plugin: generates the per-plugin `index.ts` inside that
 *     plugin's output directory (respecting `options.plugins` overrides and the
 *     plugin's own `output.barrelType`).
 *   - For `plugin-barrel` itself: generates the root `index.ts` that re-exports
 *     from all indexable sources across every plugin.
 *
 * @example
 * ```ts
 * import { pluginBarrel } from '@kubb/plugin-barrel'
 *
 * export default defineConfig({
 *   plugins: [
 *     pluginTs(),
 *     pluginZod(),
 *     // Always place pluginBarrel last
 *     pluginBarrel({
 *       root: { barrelType: 'named' },
 *       plugins: [
 *         { name: 'plugin-ts',  barrelType: 'named' },
 *         { name: 'plugin-zod', barrelType: 'all'   },
 *       ],
 *     }),
 *   ],
 * })
 * ```
 */
export const pluginBarrel = definePlugin<PluginBarrel>((options: PluginBarrelOptions = {}) => {
  let getFiles: (() => ReadonlyArray<FileNode>) | undefined
  let upsertFile: ((...files: Array<FileNode>) => void) | undefined
  let getPlugin: ((name: string) => NormalizedPlugin | undefined) | undefined
  let buildConfig: { root: string; output: { path: string } } | undefined

  return {
    name: pluginBarrelName,
    options,
    hooks: {
      'kubb:plugin:setup'(ctx) {
        ctx.setOptions(options)
      },

      'kubb:build:start'(ctx) {
        getFiles = ctx.getFiles
        upsertFile = ctx.upsertFile
        getPlugin = (name) => ctx.getPlugin(name) as NormalizedPlugin | undefined
        buildConfig = ctx.config
      },

      async 'kubb:plugin:end'(plugin, result) {
        if (!result.success || !getFiles || !upsertFile || !buildConfig) return

        if (plugin.name === pluginBarrelName) {
          await generateRootBarrel()
          return
        }

        await generatePerPluginBarrel(plugin.name)
      },
    },
  }

  async function generatePerPluginBarrel(pluginName: string): Promise<void> {
    const configEntry = options.plugins?.find((p) => p.name === pluginName)
    const normalizedPlugin = getPlugin!(pluginName)
    let barrelType: BarrelType | false | undefined

    if (configEntry !== undefined) {
      barrelType = configEntry.barrelType
    } else {
      barrelType = normalizedPlugin?.options?.output?.barrelType
    }

    if (!barrelType) return

    const output = normalizedPlugin?.options?.output
    if (!output?.path) return

    const root = resolve(buildConfig!.root, buildConfig!.output.path)
    const barrelFiles = await getBarrelFiles(getFiles!() as Array<FileNode>, {
      type: barrelType,
      root,
      output,
      meta: { pluginName },
    })

    upsertFile!(...barrelFiles)
  }

  async function generateRootBarrel(): Promise<void> {
    const rootBarrelType = options.root?.barrelType
    if (!rootBarrelType) return

    const root = resolve(buildConfig!.root)
    const rootPath = resolve(root, buildConfig!.output.path, BARREL_FILENAME)
    const rootDir = dirname(rootPath)

    const allFiles = getFiles!() as Array<FileNode>
    const indexableFiles = allFiles.filter((f) => f.sources.some((s) => s.isIndexable))

    const existingBarrel = allFiles.find((f) => f.path === rootPath)
    const existingExports = new Set(
      existingBarrel?.exports?.flatMap((e) => (Array.isArray(e.name) ? e.name : [e.name])).filter((n): n is string => Boolean(n)) ?? [],
    )

    const exports = indexableFiles.flatMap((file) => {
      const containsOnlyTypes = file.sources.every((s) => s.isTypeOnly)
      const pluginName = (file.meta as { pluginName?: string } | undefined)?.pluginName
      if (!pluginName) return []

      const configEntry = options.plugins?.find((p) => p.name === pluginName)
      let barrelType: BarrelType | false | undefined
      if (configEntry !== undefined) {
        barrelType = configEntry.barrelType
      } else {
        barrelType = getPlugin!(pluginName)?.options?.output?.barrelType
      }
      if (!barrelType) return []

      return file.sources.flatMap((source) => {
        if (!file.path || !source.isIndexable) return []

        const exportName = rootBarrelType === 'all' ? undefined : source.name ? [source.name] : undefined
        if (exportName?.some((n) => existingExports.has(n))) return []

        return [
          createExport({
            name: exportName,
            path: getRelativePath(rootDir, file.path),
            isTypeOnly: rootBarrelType === 'all' ? containsOnlyTypes : source.isTypeOnly,
          }),
        ]
      })
    })

    const rootFile = createFile<object>({
      path: rootPath,
      baseName: BARREL_FILENAME,
      exports,
      sources: [],
      imports: [],
      meta: {},
    })

    upsertFile!(rootFile)
  }
})
