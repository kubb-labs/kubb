import { useContext, usePlugin } from '@kubb/react'

import { Operation } from '../components/Operation.tsx'
import { useOperationHelpers } from './useOperationHelpers.ts'

import type { KubbFile, Plugin, ResolveNameParams } from '@kubb/core'
import type { Operation as OperationType } from '../oas/index.ts'

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
  const operation = useOperation()
  const { getName } = useOperationHelpers()

  return getName(operation, {
    pluginKey: rest.pluginKey || plugin.key,
    type,
  })
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

  const { getFile } = useOperationHelpers()

  return getFile(operation, {
    pluginKey: props.pluginKey || plugin.key,
    extName: props.extName,
  })
}
