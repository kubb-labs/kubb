/** biome-ignore-all lint/suspicious/useIterableCallbackReturn: not needed */
import { join } from 'node:path'
import type { KubbFile } from '@kubb/fabric-core/types'
import { getRelativePath } from './fs/index.ts'

import type { FileMetaBase } from './utils/getBarrelFiles.ts'
import { TreeNode } from './utils/TreeNode.ts'
import { getUniqueName } from './utils/uniqueName.ts'

type BarrelManagerOptions = {
  /**
   * Optional: Track used export names across all barrel files
   * If not provided, each barrel file will have its own namespace
   * Similar to usedEnumNames in SchemaGenerator
   */
  usedNames?: Record<string, number>
  /**
   * Scope of unique name tracking
   * - 'global': usedNames is shared across all barrel files (requires usedNames to be provided)
   * - 'perBarrel': each barrel file has its own usedNames namespace (default)
   */
  scope?: 'global' | 'perBarrel'
}

export class BarrelManager {
  #globalUsedNames?: Record<string, number>
  #scope: 'global' | 'perBarrel'
  
  constructor(options: BarrelManagerOptions = {}) {
    this.#globalUsedNames = options.usedNames
    this.#scope = options.scope || 'perBarrel'
    return this
  }

  getFiles({ files: generatedFiles, root }: { files: KubbFile.File[]; root?: string; meta?: FileMetaBase | undefined }): Array<KubbFile.File> {
    const cachedFiles = new Map<KubbFile.Path, KubbFile.File>()
    // Track used names per barrel file (unless using global scope)
    const usedNamesPerBarrel = new Map<KubbFile.Path, Record<string, number>>()
    // Track what sources have been processed (by path + original name) to avoid duplicates from TreeNode
    const processedSources = new Set<string>()

    TreeNode.build(generatedFiles, root)?.forEach((treeNode) => {
      if (!treeNode || !treeNode.children || !treeNode.parent?.data.path) {
        return undefined
      }

      const barrelFile: KubbFile.File = {
        path: join(treeNode.parent?.data.path, 'index.ts') as KubbFile.Path,
        baseName: 'index.ts',
        exports: [],
        imports: [],
        sources: [],
      }
      const previousBarrelFile = cachedFiles.get(barrelFile.path)
      
      // Get or create usedNames for this barrel file
      const usedNames = this.#scope === 'global' && this.#globalUsedNames
        ? this.#globalUsedNames
        : (usedNamesPerBarrel.get(barrelFile.path) || (() => {
            const names = {}
            usedNamesPerBarrel.set(barrelFile.path, names)
            return names
          })())

      const leaves = treeNode.leaves

      leaves.forEach((item) => {
        if (!item.data.name) {
          return undefined
        }

        const sources = item.data.file?.sources || []

        sources.forEach((source) => {
          if (!item.data.file?.path || !source.isIndexable || !source.name) {
            return undefined
          }

          if (!barrelFile.exports) {
            barrelFile.exports = []
          }

          // true when we have a subdirectory that also contains barrel files
          const isSubExport = !!treeNode.parent?.data.path?.split?.('/')?.length

          if (isSubExport) {
            barrelFile.exports.push({
              name: [source.name],
              path: getRelativePath(treeNode.parent?.data.path, item.data.path),
              isTypeOnly: source.isTypeOnly,
            })
          } else {
            barrelFile.exports.push({
              name: [source.name],
              path: `./${item.data.file.baseName}`,
              isTypeOnly: source.isTypeOnly,
            })
          }

          barrelFile.sources.push({
            name: source.name,
            isTypeOnly: source.isTypeOnly,
            //TODO use parser to generate import
            value: '',
            isExportable: false,
            isIndexable: false,
          })
        })
      })

      if (previousBarrelFile) {
        // When merging, use getUniqueName to avoid duplicate identifiers
        // Generate unique names with numeric suffixes for duplicates
        barrelFile.sources.forEach((newSource, index) => {
          const correspondingExport = barrelFile.exports?.[index]
          
          // Skip if no corresponding export or if name is undefined
          if (!correspondingExport || !newSource.name) {
            return
          }
          
          // Create a unique key for this source: path + original name
          // This allows the same file to export multiple things with different names
          const sourceKey = `${correspondingExport.path}:${newSource.name}`
          
          // Skip if we've already processed this exact source
          if (processedSources.has(sourceKey)) {
            return
          }
          
          // Mark as processed
          processedSources.add(sourceKey)
          
          const uniqueName = getUniqueName(newSource.name, usedNames)
          
          // Update source name
          previousBarrelFile.sources.push({
            ...newSource,
            name: uniqueName,
          })

          // Update corresponding export name to match
          if (correspondingExport) {
            previousBarrelFile.exports?.push({
              ...correspondingExport,
              name: [uniqueName],
            })
          }
        })
      } else {
        // First time seeing this barrel file - still need to apply getUniqueName
        // to handle duplicates within this initial set
        barrelFile.sources = barrelFile.sources.map((source, index) => {
          const correspondingExport = barrelFile.exports?.[index]
          
          // Skip processing if name is undefined or no corresponding export
          if (!source.name || !correspondingExport) {
            return source
          }
          
          const uniqueName = getUniqueName(source.name, usedNames)
          
          // Mark as processed
          const sourceKey = `${correspondingExport.path}:${source.name}`
          processedSources.add(sourceKey)
          
          return {
            ...source,
            name: uniqueName,
          }
        })

        barrelFile.exports = barrelFile.exports?.map((exp, index) => {
          // Use the same unique name that was generated for the corresponding source
          const correspondingSource = barrelFile.sources[index]
          if (correspondingSource && correspondingSource.name) {
            return {
              ...exp,
              name: [correspondingSource.name],
            }
          }
          return exp
        })

        cachedFiles.set(barrelFile.path, barrelFile)
      }
    })

    return [...cachedFiles.values()]
  }
}
