/** biome-ignore-all lint/suspicious/useIterableCallbackReturn: not needed */
import { join } from 'node:path'
import type { KubbFile } from '@kubb/fabric-core/types'
import { getRelativePath } from './fs/index.ts'

import type { FileMetaBase } from './utils/getBarrelFiles.ts'
import { TreeNode } from './utils/TreeNode.ts'
import { getUniqueName } from './utils/uniqueName.ts'

type BarrelManagerOptions = {}

export class BarrelManager {
  // Keep track of already used export names per barrel file
  // Similar to #usedAliasNames in SchemaGenerator
  #usedNamesPerBarrel: Map<KubbFile.Path, Record<string, number>> = new Map()
  
  constructor(_options: BarrelManagerOptions = {}) {
    return this
  }

  getFiles({ files: generatedFiles, root }: { files: KubbFile.File[]; root?: string; meta?: FileMetaBase | undefined }): Array<KubbFile.File> {
    const cachedFiles = new Map<KubbFile.Path, KubbFile.File>()
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
      
      // Get or create usedNames for this barrel file (persisted in instance variable)
      let usedNames = this.#usedNamesPerBarrel.get(barrelFile.path)
      if (!usedNames) {
        usedNames = {}
        this.#usedNamesPerBarrel.set(barrelFile.path, usedNames)
      }

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
