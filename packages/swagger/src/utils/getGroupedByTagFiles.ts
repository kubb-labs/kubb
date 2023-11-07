import path from 'node:path'

import { getRelativePath, type Logger, renderTemplate } from '@kubb/core/utils'

import { camelCase, camelCaseTransformMerge } from 'change-case'

import type { KubbFile, KubbPlugin, ResolveNameParams } from '@kubb/core'

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
  resolveName: (params: ResolveNameParams) => string
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
  resolveName,
}: Options): KubbFile.File<FileMeta>[] {
  return files.filter(file => file.meta?.pluginKey?.[1] === plugin.name)
    .map((file: KubbFile.File<FileMeta>) => {
      if (!file.meta?.tag) {
        logger?.warn(`Could not find a tagName for ${JSON.stringify(file, undefined, 2)}`)

        return
      }

      const tag = file.meta?.tag && camelCase(file.meta.tag, { delimiter: '', transform: camelCaseTransformMerge })
      const tagPath = getRelativePath(path.resolve(root, output), path.resolve(root, renderTemplate(template, { tag })))
      const tagName = renderTemplate(exportAs, { tag })

      /*
            const tagName = camelCase(renderTemplate(groupBy.exportAs || '{{tag}}Mocks', { tag }), {
              delimiter: '',
              transform: camelCaseTransformMerge,
            })
      */

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
