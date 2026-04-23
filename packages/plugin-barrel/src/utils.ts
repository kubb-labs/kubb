import { dirname, resolve } from 'node:path'
import { getRelativePath } from '@internals/utils'
import type { FileNode } from '@kubb/ast'
import { createExport, createFile } from '@kubb/ast'
import type { NormalizedPlugin } from '@kubb/core'
import { BARREL_FILENAME } from './constants.ts'
import type { BarrelType, PluginBarrelOptions } from './types.ts'
import { getBarrelFiles } from './utils/getBarrelFiles.ts'

type BuildConfig = { root: string; output: { path: string } }

export async function generatePerPluginBarrel(
  pluginName: string,
  options: PluginBarrelOptions,
  files: ReadonlyArray<FileNode>,
  buildConfig: BuildConfig,
  getPlugin: (name: string) => NormalizedPlugin | undefined,
  upsertFile: (...files: Array<FileNode>) => void,
): Promise<void> {
  const configEntry = options.plugins?.find((p) => p.name === pluginName)
  const normalizedPlugin = getPlugin(pluginName)
  let barrelType: BarrelType | false | undefined

  if (configEntry !== undefined) {
    barrelType = configEntry.barrelType
  } else {
    barrelType = normalizedPlugin?.options?.output?.barrelType
  }

  if (!barrelType) return

  const output = normalizedPlugin?.options?.output
  if (!output?.path) return

  const root = resolve(buildConfig.root, buildConfig.output.path)
  const barrelFiles = await getBarrelFiles(files as Array<FileNode>, {
    type: barrelType,
    root,
    output,
    meta: { pluginName },
  })

  upsertFile(...barrelFiles)
}

export async function generateRootBarrel(
  options: PluginBarrelOptions,
  files: ReadonlyArray<FileNode>,
  buildConfig: BuildConfig,
  getPlugin: (name: string) => NormalizedPlugin | undefined,
  upsertFile: (...files: Array<FileNode>) => void,
): Promise<void> {
  const rootBarrelType = options.root?.barrelType
  if (!rootBarrelType) return

  const root = resolve(buildConfig.root)
  const rootPath = resolve(root, buildConfig.output.path, BARREL_FILENAME)
  const rootDir = dirname(rootPath)

  const allFiles = files as Array<FileNode>
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
      barrelType = getPlugin(pluginName)?.options?.output?.barrelType
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

  upsertFile(rootFile)
}
