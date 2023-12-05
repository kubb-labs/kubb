import path from 'node:path'

import { FileManager } from '@kubb/core'
import { getRelativePath } from '@kubb/core/fs'
import { LogLevel } from '@kubb/core/logger'
import transformers from '@kubb/core/transformers'
import { renderTemplate } from '@kubb/core/utils'

import type { KubbFile, KubbPlugin } from '@kubb/core'
import type { Logger } from '@kubb/core/logger'

type Options = {
  logger?: Logger
  files: KubbFile.File[]
  plugin: KubbPlugin
  template: string
  exportAs: string
  /**
   * Root based on root and output.path specified in the config
   */
  root: string
  /**
   * Output for plugin
   */
  output: {
    path: string
    exportAs?: string
    extName?: string
  }
}

type FileMeta = {
  pluginKey?: KubbPlugin['key']
  tag?: string
}

export async function getGroupedByTagFiles({
  logger,
  files,
  plugin,
  template,
  exportAs,
  root,
  output,
}: Options): Promise<KubbFile.File<FileMeta>[]> {
  const mode = FileManager.getMode(path.resolve(root, output.path))

  if (mode === 'file') {
    return []
  }

  const groupedFiles = files.filter(file => {
    const name = file.meta?.pluginKey?.[0]
    return name === plugin.name
  })
    .map((file: KubbFile.File<FileMeta>) => {
      if (!file.meta?.tag) {
        if (logger?.logLevel === LogLevel.debug) {
          logger?.warn(`Could not find a tagName for ${JSON.stringify(file, undefined, 2)}`)
        }

        return
      }

      const tag = file.meta?.tag && transformers.camelCase(file.meta.tag)
      const tagPath = getRelativePath(path.resolve(root, output.path), path.resolve(root, renderTemplate(template, { tag })))
      const tagName = renderTemplate(exportAs, { tag })

      if (tagName) {
        return {
          baseName: 'index.ts' as const,
          path: path.resolve(root, output.path, 'index.ts'),
          source: '',
          exports: [{ path: output.extName ? `${tagPath}/index${output.extName}` : `${tagPath}/index`, asAlias: true, name: tagName }],
          meta: {
            pluginKey: plugin.key,
          },
        }
      }
    })
    .filter(Boolean)

  return FileManager.combineFiles(groupedFiles)
}
