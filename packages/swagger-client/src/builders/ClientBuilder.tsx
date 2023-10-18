/* eslint- @typescript-eslint/explicit-module-boundary-types */
import { FunctionParams, getRelativePath, URLPath } from '@kubb/core'
import { createRoot, File } from '@kubb/react'
import { getASTParams, getComments, OasBuilder, useResolve, useResolveName, useSchemas } from '@kubb/swagger'
import { useResolve as useResolveType } from '@kubb/swagger-ts'

import { ClientFunction } from '../components/index.ts'
import { pluginName } from '../plugin.ts'

import type { KubbFile, PluginManager } from '@kubb/core'
import type { AppContextProps, RootType } from '@kubb/react'
import type { Operation, OperationSchemas } from '@kubb/swagger'
import type { AppMeta, Options as PluginOptions } from '../types.ts'

type Config = {
  pluginManager: PluginManager
  dataReturnType: PluginOptions['dataReturnType']
  operation: Operation
  schemas: OperationSchemas
  clientPath?: KubbFile.OptionalPath
  clientImportPath?: KubbFile.OptionalPath
}

type ClientResult = { Component: React.ElementType }

export class ClientBuilder extends OasBuilder<Config> {
  private get client(): ClientResult {
    const { operation, schemas, dataReturnType } = this.config

    const comments = getComments(operation)
    const method = operation.method

    const generics = new FunctionParams()
    const clientGenerics = new FunctionParams()
    const params = new FunctionParams()

    generics.add([
      { type: 'TData', default: schemas.response.name },
      { type: 'TVariables', default: schemas.request?.name, enabled: !!schemas.request?.name },
    ])

    clientGenerics.add([{ type: 'TData' }, { type: 'TVariables', enabled: !!schemas.request?.name }])

    params.add([
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
      const name = useResolveName({ pluginName, type: 'function' })

      return (
        <ClientFunction
          name={name}
          generics={generics.toString()}
          clientGenerics={clientGenerics.toString()}
          dataReturnType={dataReturnType}
          params={params.toString()}
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
    const { pluginManager, clientPath, clientImportPath, operation, schemas } = this.config
    const { Component: ClientQuery } = this.client

    const root = createRoot<AppContextProps<AppMeta>>()

    const Component = () => {
      const schemas = useSchemas()
      const file = useResolve({ pluginName, type: 'file' })
      const fileType = useResolveType({ type: 'file' })

      const resolvedClientPath = clientImportPath ? clientImportPath : clientPath ? getRelativePath(file.path, clientPath) : '@kubb/swagger-client/client'

      return (
        <File baseName={file.baseName} path={file.path}>
          <File.Import name={'client'} path={resolvedClientPath} />
          <File.Import name={['ResponseConfig']} path={resolvedClientPath} isTypeOnly />
          <File.Import
            name={[schemas.request?.name, schemas.response.name, schemas.pathParams?.name, schemas.queryParams?.name, schemas.headerParams?.name].filter(
              Boolean,
            )}
            path={getRelativePath(file.path, fileType.path)}
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
