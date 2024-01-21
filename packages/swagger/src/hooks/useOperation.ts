import { useApp, useFile, usePlugin, usePluginManager } from '@kubb/react'

import type { KubbFile, Plugin, ResolveNameParams } from '@kubb/core'
import type { Operation } from 'oas/operation'
import type { PluginOptions, ResolvePathOptions } from '../types.ts'

export function useOperation(): Operation {
  const { meta } = useApp<PluginOptions['appMeta']>()

  return meta.operation
}

type UseOperationNameProps = {
  type: NonNullable<ResolveNameParams['type']>
  pluginKey?: Plugin['key']
}

export function useOperationName({ type, ...rest }: UseOperationNameProps): string {
  const plugin = usePlugin()
  const pluginManager = usePluginManager()
  const operation = useOperation()

  const pluginKey = rest.pluginKey || plugin.key

  return pluginManager.resolveName({ name: operation.getOperationId(), pluginKey, type })
}

type FileMeta = KubbFile.FileMetaBase & {
  pluginKey: Plugin['key']
  name: string
  tag?: string
}

type UseOperationFileProps = {
  pluginKey?: Plugin['key']
}

export function useOperationFile(props: UseOperationFileProps = {}): KubbFile.File<FileMeta> {
  const plugin = usePlugin()
  const operation = useOperation()

  const pluginKey = props.pluginKey || plugin.key
  // needed for the `output.group`
  const tag = operation?.getTags().at(0)?.name
  const name = useOperationName({ type: 'file', pluginKey })
  const file = useFile<ResolvePathOptions>({ name, pluginKey, options: { type: 'file', pluginKey, tag } })

  return {
    ...file,
    meta: {
      ...file.meta,
      name,
      pluginKey,
      tag,
    },
  }
}
