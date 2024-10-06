import { URLPath } from '@kubb/core/utils'
import type { PluginOas } from '@kubb/plugin-oas'
import { createReactGenerator } from '@kubb/plugin-oas'
import { useOperationManager } from '@kubb/plugin-oas/hooks'
import { File } from '@kubb/react'
import React from 'react'

export const example2 = createReactGenerator<PluginOas>({
  name: 'client-operation',
  Operation({ operation }) {
    const { getName, getFile } = useOperationManager()

    const client = {
      name: getName(operation, { type: 'function' }),
      file: getFile(operation),
    }

    return (
      <File baseName={client.file.baseName} path={client.file.path} meta={client.file.meta}>
        <File.Source>
          {`
          export const ${operation.getOperationId()} = {
            method: '${operation.method}',
            url: '${new URLPath(operation.path).URL}'
          }
        `}
        </File.Source>
      </File>
    )
  },
})
