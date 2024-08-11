import { URLPath } from '@kubb/core/utils'
import { Const, File, useApp } from '@kubb/react'

import type { HttpMethod, Operation } from '@kubb/oas'
import type { FileMeta, PluginClient } from '../types.ts'
import { createParser } from '@kubb/plugin-oas'

type OperationsProps = {
  operations: Array<Operation>
}

export function Operations({ operations }: OperationsProps) {
  const operationsObject: Record<string, { path: string; method: HttpMethod }> = {}

  operations.forEach((operation) => {
    operationsObject[operation.getOperationId()] = {
      path: new URLPath(operation.path).URL,
      method: operation.method,
    }
  })

  return (
    <Const name={'operations'} export asConst>
      {JSON.stringify(operationsObject, undefined, 2)}
    </Const>
  )
}

export const operationsParser = createParser<PluginClient>({
  name: 'operations',
  templates: {
    Operations({ operations }) {
      const {
        pluginManager,
        plugin: { key: pluginKey },
      } = useApp<PluginClient>()

      const file = pluginManager.getFile({ name: 'operations', extName: '.ts', pluginKey })

      return (
        <File<FileMeta> baseName={file.baseName} path={file.path} meta={file.meta} exportable={false}>
          <File.Source>
            <Operations operations={operations} />
          </File.Source>
        </File>
      )
    },
  },
})
