import path from 'node:path'

import { getRelativePath } from '@kubb/core/utils'
import { File, usePluginManager } from '@kubb/react'
import { usePlugin } from '@kubb/react'
import { useOperation, useResolve, useSchemas } from '@kubb/swagger/hooks'
import { useResolve as useResolveType } from '@kubb/swagger-ts/hooks'

import { Client } from './Client.tsx'

import type { ReactNode } from 'react'
import type { FileMeta, PluginOptions } from '../types.ts'

export function ClientFile(): ReactNode {
  const { key: pluginKey, options } = usePlugin<PluginOptions>()
  const { config } = usePluginManager()

  const { clientImportPath, dataReturnType, pathParamsType, client } = options

  const root = path.resolve(config.root, config.output.path)
  const clientPath = client ? path.resolve(root, 'client.ts') : undefined

  const schemas = useSchemas()
  const operation = useOperation()
  const file = useResolve({ pluginKey, type: 'file' })
  const fileType = useResolveType({ type: 'file' })

  const resolvedClientPath = clientImportPath ? clientImportPath : clientPath ? getRelativePath(file.path, clientPath) : '@kubb/swagger-client/client'

  return (
    <File<FileMeta>
      baseName={file.baseName}
      path={file.path}
      meta={{
        pluginKey,
        tag: operation.getTags()[0]?.name,
      }}
    >
      <File.Import name={'client'} path={resolvedClientPath} />
      <File.Import name={['ResponseConfig']} path={resolvedClientPath} isTypeOnly />
      <File.Import
        name={[schemas.request?.name, schemas.response.name, schemas.pathParams?.name, schemas.queryParams?.name, schemas.headerParams?.name].filter(
          Boolean,
        )}
        root={file.path}
        path={fileType.path}
        isTypeOnly
      />
      <File.Source>
        <Client pluginKey={pluginKey} dataReturnType={dataReturnType} pathParamsType={pathParamsType} />
      </File.Source>
    </File>
  )
}
