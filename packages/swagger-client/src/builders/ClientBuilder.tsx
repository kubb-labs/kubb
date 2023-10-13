/* eslint- @typescript-eslint/explicit-module-boundary-types */
import { createFunctionParams, getRelativePath, URLPath } from '@kubb/core'
import { createRoot, File } from '@kubb/react'
import { getASTParams, getComments, OasBuilder, useResolve, useSchemas } from '@kubb/swagger'
import { useResolve as useResolveType } from '@kubb/swagger-ts'

import { ClientFunction } from '../components/index.ts'
import { pluginName } from '../plugin.ts'

import type { OptionalPath, PluginManager } from '@kubb/core'
import type { AppContextProps, RootType } from '@kubb/react'
import type { Operation, OperationSchemas } from '@kubb/swagger'
import type { AppMeta, Options as PluginOptions } from '../types.ts'

type Config = {
  pluginManager: PluginManager
  dataReturnType: PluginOptions['dataReturnType']
  operation: Operation
  schemas: OperationSchemas
  clientPath?: OptionalPath
}

type ClientResult = { Component: React.ElementType }

export class ClientBuilder extends OasBuilder<Config> {
  private get client(): ClientResult {
    const { operation, schemas, dataReturnType } = this.config

    const comments = getComments(operation)
    const method = operation.method

    // TODO use of new Class for creating params
    const generics = createFunctionParams([
      { type: 'TData', default: schemas.response.name },
      { type: 'TVariables', enabled: !!schemas.request?.name, default: schemas.request?.name },
    ])
    const clientGenerics = createFunctionParams([{ type: 'TData' }, { type: 'TVariables', enabled: !!schemas.request?.name }])

    const params = createFunctionParams([
      ...getASTParams(schemas.pathParams, { typed: true }),
      {
        name: 'data',
        type: 'TVariables',
        enabled: !!schemas.request?.name,
        required: !!schemas.request?.schema.required?.length,
      },
      {
        name: 'params',
        type: schemas.queryParams?.name,
        enabled: !!schemas.queryParams?.name,
        required: !!schemas.queryParams?.schema.required?.length,
      },
      {
        name: 'headers',
        type: schemas.headerParams?.name,
        enabled: !!schemas.headerParams?.name,
        required: !!schemas.headerParams?.schema.required?.length,
      },
      {
        name: 'options',
        type: `Partial<Parameters<typeof client>[0]>`,
        default: '{}',
      },
    ])

    const Component = () => {
      const schemas = useSchemas()
      const file = useResolve({ pluginName })

      return (
        <ClientFunction
          name={file.name}
          generics={generics}
          clientGenerics={clientGenerics}
          dataReturnType={dataReturnType}
          params={params}
          returnType={dataReturnType === 'data' ? `ResponseConfig<TData>["data"]` : `ResponseConfig<TData>`}
          method={method}
          path={new URLPath(operation.path)}
          withParams={!!schemas.queryParams?.name}
          withData={!!schemas.request?.name}
          withHeaders={!!schemas.headerParams?.name}
          comments={comments}
        />
      )
    }

    return { Component }
  }

  configure(config: Config): this {
    this.config = config

    return this
  }

  print(): string {
    return this.render().output
  }

  render(): RootType<AppContextProps<AppMeta>> {
    const { pluginManager, clientPath, operation, schemas } = this.config
    const { Component: ClientQuery } = this.client

    const root = createRoot<AppContextProps<AppMeta>>()

    const Component = () => {
      const schemas = useSchemas()
      const file = useResolve({ pluginName })
      const fileType = useResolveType()

      const resolvedClientPath = clientPath ? getRelativePath(file.filePath, clientPath) : '@kubb/swagger-client/client'

      return (
        <File fileName={file.fileName} path={file.filePath}>
          <File.Import name={'client'} path={resolvedClientPath} />
          <File.Import name={['ResponseConfig']} path={resolvedClientPath} isTypeOnly />
          <File.Import
            name={[schemas.request?.name, schemas.response.name, schemas.pathParams?.name, schemas.queryParams?.name, schemas.headerParams?.name].filter(
              Boolean,
            )}
            path={getRelativePath(file.filePath, fileType.filePath)}
            isTypeOnly
          />
          <File.Source>
            <ClientQuery />
          </File.Source>
        </File>
      )
    }

    root.render(<Component />, { meta: { pluginManager, schemas, operation } })

    return root
  }
}
