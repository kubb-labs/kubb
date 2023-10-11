/* eslint- @typescript-eslint/explicit-module-boundary-types */
import { combineCodes, createFunctionParams, URLPath } from '@kubb/core'
import { createRoot, Import as ImportTemplate } from '@kubb/react-template'
import { getASTParams, getComments, OasBuilder } from '@kubb/swagger'

import { ClientFunction } from '../components/index.ts'

import type { Import, PluginManager } from '@kubb/core'
import type { AppContextProps } from '@kubb/react-template'
import type { Operation, OperationSchemas } from '@kubb/swagger'
import type { AppMeta, Options as PluginOptions } from '../types'

type Config = {
  pluginManager: PluginManager
  dataReturnType: PluginOptions['dataReturnType']
  operation: Operation
  schemas: OperationSchemas
  name: string
  clientPath: string
}

type ClientResult = { code: string; name: string; imports: Import[] }

export class ClientBuilder extends OasBuilder<Config> {
  private get client(): ClientResult {
    const { pluginManager, name, operation, schemas, clientPath, dataReturnType } = this.config
    const codes: string[] = []

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
      return (
        <>
          <ImportTemplate name={'client'} path={clientPath} />
          <ImportTemplate name={['ResponseConfig']} path={clientPath} isTypeOnly />
          <ClientFunction
            name={name}
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
        </>
      )
    }
    const root = createRoot<AppContextProps<AppMeta>>()
    root.render(<Component />, { meta: { pluginManager } })

    codes.push(root.output)

    return { code: combineCodes(codes), name, imports: root.imports }
  }

  configure(config: Config): this {
    this.config = config

    return this
  }

  print(): string {
    return this.client.code
  }

  imports(): Import[] {
    return this.client.imports
  }
}
