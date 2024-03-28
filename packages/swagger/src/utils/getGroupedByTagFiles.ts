import { resolve } from 'node:path'

import { FileManager } from '@kubb/core'
import { getRelativePath } from '@kubb/core/fs'
import { LogLevel } from '@kubb/core/logger'
import transformers from '@kubb/core/transformers'
import { renderTemplate } from '@kubb/core/utils'

import type { KubbFile, Plugin } from '@kubb/core'
import type { Logger } from '@kubb/core/logger'

type Options = {
  logger?: Logger
  files: KubbFile.File[]
  plugin: Plugin
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
    extName?: KubbFile.Extname
    exportType?: 'barrel' | 'barrelNamed' | false
  }
}

type FileMeta = {
  pluginKey?: Plugin['key']
  tag?: string
}

export async function getGroupedByTagFiles({ logger, files, plugin, template, exportAs, root, output }: Options): Promise<KubbFile.File<FileMeta>[]> {
  const { path, exportType = 'barrel' } = output
  const mode = FileManager.getMode(resolve(root, path))

  if (mode === 'file' || exportType === false) {
    return []
  }

  return files
    .filter((file) => {
      const name = file.meta?.pluginKey?.[0]
      return name === plugin.name
    })
    .map((file: KubbFile.File<FileMeta>) => {
      if (!file.meta?.tag) {
        if (logger?.logLevel === LogLevel.debug) {
          logger?.emit('debug', [`Could not find a tagName for ${JSON.stringify(file, undefined, 2)}`])
        }

        return
      }

      const tag = file.meta?.tag && transformers.camelCase(file.meta.tag)
      const tagPath = getRelativePath(resolve(root, output.path), resolve(root, renderTemplate(template, { tag })))
      const tagName = renderTemplate(exportAs, { tag })

      if (tagName) {
        return {
          baseName: 'index.ts' as const,
          path: resolve(root, output.path, 'index.ts'),
          source: '',
          exports: [
            {
              path: output.extName ? `${tagPath}/index${output.extName}` : `${tagPath}/index`,
              asAlias: true,
              name: tagName,
            },
          ],
          meta: {
            pluginKey: plugin.key,
          },
        }
      }
    })
    .filter(Boolean)
}
