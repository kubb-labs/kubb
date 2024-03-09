import { useContext, useFile, usePlugin, usePluginManager } from '@kubb/react'

import { Operation } from '../components/Operation.tsx'

import type { KubbFile, Plugin, ResolveNameParams } from '@kubb/core'
import type { Operation as OperationType } from '../oas/index.ts'
import type { ResolvePathOptions } from '../types.ts'

export function useOperation(): OperationType {
  const { operation } = useContext(Operation.Context)

  if (!operation) {
    throw new Error('Operation is not defined')
  }

  return operation
}

type UseOperationNameProps = {
  type: ResolveNameParams['type']
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
  extName?: KubbFile.Extname
  pluginKey?: Plugin['key']
}

export function useOperationFile(props: UseOperationFileProps = {}): KubbFile.File<FileMeta> {
  const plugin = usePlugin()
  const operation = useOperation()

  const pluginKey = props.pluginKey || plugin.key
  // needed for the `output.group`
  const tag = operation?.getTags().at(0)?.name
  const name = useOperationName({ type: 'file', pluginKey })
  const extName = props.extName || '.ts'
  const file = useFile<ResolvePathOptions>({ name, extName, pluginKey, options: { type: 'file', pluginKey, tag } })

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
