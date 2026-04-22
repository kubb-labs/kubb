import { dirname, resolve } from 'node:path'
import { getRelativePath } from '@internals/utils'
import { createExport, createFile } from '@kubb/ast'
import { BARREL_FILENAME, definePlugin, getBarrelFiles } from '@kubb/core'
import type { BarrelType, FileMetaBase, KubbBarrelGenerateContext, NormalizedPlugin } from '@kubb/core'
import type { PluginBarrel, PluginBarrelOptions } from './types.ts'
import { pluginBarrelName } from './types.ts'

/**
 * Resolves the effective barrel type for a plugin.
 *
 * Resolution order:
 * 1. Entry in `plugin-barrel` options `plugins` array.
 * 2. Plugin's own `output.barrelType` option.
 * 3. `'named'` as the default fallback.
 */
function resolvePluginBarrelType(
  pluginName: string,
  barrelPluginOptions: PluginBarrelOptions,
  normalizedPlugin: NormalizedPlugin | undefined,
): BarrelType | false {
  const entry = barrelPluginOptions.plugins?.find((p) => p.name === pluginName)
  if (entry) {
    return entry.barrelType
  }
  return normalizedPlugin?.options?.output?.barrelType ?? 'named'
}

/**
 * Generates per-plugin `index.ts` barrel files for every registered plugin
 * that has an `output.path` configured.
 */
async function generatePluginBarrels(ctx: KubbBarrelGenerateContext, options: PluginBarrelOptions): Promise<void> {
  const { config, driver, upsertFile } = ctx
  const root = resolve(config.root, config.output.path)

  for (const [, plugin] of driver.plugins) {
    // Skip plugin-barrel itself — it produces no source files
    if (plugin.name === pluginBarrelName) {
      continue
    }

    const normalizedPlugin = plugin as NormalizedPlugin
    const output = normalizedPlugin.options?.output
    if (!output?.path) {
      continue
    }

    const barrelType = resolvePluginBarrelType(plugin.name, options, normalizedPlugin)

    const barrelFiles = await getBarrelFiles(driver.fileManager.files, {
      type: barrelType,
      root,
      output,
      meta: { pluginName: plugin.name },
    })

    upsertFile(...barrelFiles)
  }
}

/**
 * Generates the root `index.ts` barrel file at `config.root/config.output.path/index.ts`.
 *
 * Iterates all indexable files and builds export entries, respecting per-plugin
 * barrel-type overrides from `plugin-barrel` options.
 */
function generateRootBarrel(ctx: KubbBarrelGenerateContext, options: PluginBarrelOptions): void {
  const { config, driver, upsertFile } = ctx
  const rootBarrelType = options.root?.barrelType

  if (!rootBarrelType) {
    return
  }

  const root = resolve(config.root)
  const rootPath = resolve(root, config.output.path, BARREL_FILENAME)
  const rootDir = dirname(rootPath)

  const pluginMap = new Map<string, NormalizedPlugin>()
  for (const [name, plugin] of driver.plugins) {
    pluginMap.set(name, plugin as NormalizedPlugin)
  }

  const indexableFiles = driver.fileManager.files.filter((file) => file.sources.some((s) => s.isIndexable))

  const existingBarrel = driver.fileManager.files.find((f) => f.path === rootPath)
  const existingExports = new Set(
    existingBarrel?.exports?.flatMap((e) => (Array.isArray(e.name) ? e.name : [e.name])).filter((n): n is string => Boolean(n)) ?? [],
  )

  const exports = indexableFiles.flatMap((file) => {
    const containsOnlyTypes = file.sources.every((s) => s.isTypeOnly)
    const meta = file.meta as FileMetaBase | undefined
    const pluginName = meta?.pluginName
    if (!pluginName) return []

    const normalizedPlugin = pluginMap.get(pluginName)
    const effectiveBarrelType = resolvePluginBarrelType(pluginName, options, normalizedPlugin)

    if (effectiveBarrelType === false) {
      return []
    }

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
    exports: exports.map((e) => createExport(e)),
    sources: [],
    imports: [],
    meta: {},
  })

  upsertFile(rootFile)
}

/**
 * Barrel-file generation plugin.
 *
 * When added to `plugins`, it takes over all `index.ts` barrel file generation
 * (both per-plugin and root) from the default `createKubb` pipeline.
 * The default barrel logic in `createKubb` is automatically skipped while this
 * plugin is registered, so there is no duplication.
 *
 * @example
 * ```ts
 * import { pluginBarrel } from '@kubb/plugin-barrel'
 *
 * export default defineConfig({
 *   plugins: [
 *     pluginTs(),
 *     pluginZod(),
 *     pluginBarrel({
 *       root: { barrelType: 'named' },
 *       plugins: [
 *         { name: 'plugin-ts', barrelType: 'named' },
 *         { name: 'plugin-zod', barrelType: 'all' },
 *       ],
 *     }),
 *   ],
 * })
 * ```
 */
export const pluginBarrel = definePlugin<PluginBarrel>((options = {}) => ({
  name: pluginBarrelName,
  options,
  hooks: {
    'kubb:plugin:setup'(ctx) {
      ctx.setOptions(options)
    },
    async 'kubb:barrel:generate'(ctx) {
      await generatePluginBarrels(ctx, options)
      generateRootBarrel(ctx, options)
    },
  },
}))
