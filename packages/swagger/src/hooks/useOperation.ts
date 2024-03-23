import { useContext, usePlugin } from '@kubb/react'

import { Operation } from '../components/Operation.tsx'
import { useOperationHelpers } from './useOperationHelpers.ts'

import type { KubbFile, Plugin, ResolveNameParams } from '@kubb/core'
import type { Operation as OperationType } from '../oas/index.ts'

/**
 * `useOperations` will return the current `Operation`
 */
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

/**
 * `useOperationName` will return the name based on the current operation and plugin(when `pluginKey` is not provided).
 */
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

type UseGetOperationFileProps = {
  extName?: KubbFile.Extname
  pluginKey?: Plugin['key']
}

/**
 * `useGetOperationFile` will create all the props used for `<File/>` based on the current operation and plugin(when `pluginKey` is not provided)
 * Internally `useFile` of `@kubb/react` is getting used.
 */
export function useGetOperationFile(props: UseGetOperationFileProps = {}): KubbFile.File<FileMeta> {
  const plugin = usePlugin()
  const operation = useOperation()

  const { getFile } = useOperationHelpers()

  return getFile(operation, {
    pluginKey: props.pluginKey || plugin.key,
    extName: props.extName,
  })
}
