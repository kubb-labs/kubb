import path from 'node:path'

import { getRelativePath, renderTemplate } from '@kubb/core/utils'

import { camelCase, camelCaseTransformMerge } from 'change-case'

import type { KubbFile, KubbPlugin } from '@kubb/core'
import type { Logger } from '@kubb/core/utils'

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
  output: string
}

type FileMeta = {
  pluginKey?: KubbPlugin['key']
  tag?: string
}

export function getGroupedByTagFiles({
  logger,
  files,
  plugin,
  template,
  exportAs,
  root,
  output,
}: Options): KubbFile.File<FileMeta>[] {
  return files.filter(file => {
    const name = file.meta?.pluginKey?.[0]
    return name === plugin.name
  })
    .map((file: KubbFile.File<FileMeta>) => {
      if (!file.meta?.tag) {
        logger?.warn(`Could not find a tagName for ${JSON.stringify(file, undefined, 2)}`)

        return
      }

      const tag = file.meta?.tag && camelCase(file.meta.tag, { delimiter: '', transform: camelCaseTransformMerge })
      const tagPath = getRelativePath(path.resolve(root, output), path.resolve(root, renderTemplate(template, { tag })))
      const tagName = renderTemplate(exportAs, { tag })

      if (tagName) {
        return {
          baseName: 'index.ts' as const,
          path: path.resolve(root, output, 'index.ts'),
          source: '',
          exports: [{ path: `${tagPath}/index`, asAlias: true, name: tagName }],
          meta: {
            pluginKey: plugin.key,
          },
        }
      }
    })
    .filter(Boolean)
}
