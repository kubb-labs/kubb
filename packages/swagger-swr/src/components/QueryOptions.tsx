import transformers from '@kubb/core/transformers'
import { FunctionParams, URLPath } from '@kubb/core/utils'
import { Function, useApp } from '@kubb/react'
import { useOperation, useOperationManager } from '@kubb/swagger/hooks'
import { getASTParams } from '@kubb/swagger/utils'

import type { HttpMethod } from '@kubb/oas'
import type { ReactNode } from 'react'
import type { PluginOptions } from '../types.ts'

type TemplateProps = {
  /**
   * Name of the function
   */
  name: string
  /**
   * Parameters/options/props that need to be used
   */
  params: string
  /**
   * Generics that needs to be added for TypeScript
   */
  generics?: string
  /**
   * ReturnType(see async for adding Promise type)
   */
  returnType?: string
  /**
   * Options for JSdocs
   */
  JSDoc?: {
    comments: string[]
  }
  client: {
    generics: string
    method: HttpMethod
    path: URLPath
    withQueryParams: boolean
    withPathParams: boolean
    withData: boolean
    withHeaders: boolean
    contentType: string
  }
  dataReturnType: NonNullable<PluginOptions['options']['dataReturnType']>
}

function Template({ name, params, generics, returnType, JSDoc, client, dataReturnType }: TemplateProps): ReactNode {
  const headers = [
    client.contentType !== 'application/json' ? `'Content-Type': '${client.contentType}'` : undefined,
    client.withHeaders ? '...headers' : undefined,
  ]
    .filter(Boolean)
    .join(', ')

  const clientOptions = [
    `method: "${client.method}"`,
    `url: ${client.path.template}`,
    client.withQueryParams ? 'params' : undefined,
    client.withData ? 'data' : undefined,
    headers.length ? `headers: { ${headers}, ...options.headers }` : undefined,
    '...options',
  ].filter(Boolean)

  const resolvedClientOptions = `${transformers.createIndent(4)}${clientOptions.join(`,\n${transformers.createIndent(4)}`)}`

  return (
    <Function name={name} export generics={generics} returnType={returnType} params={params} JSDoc={JSDoc}>
      {`
      return {
        fetcher: async () => {
          const res = await client<${client.generics}>({
            ${resolvedClientOptions}
          })

          return ${dataReturnType === 'data' ? 'res.data' : 'res'}
        },
      }

       `}
    </Function>
  )
}

const defaultTemplates = {
  default: Template,
} as const

type Props = {
  factory: {
    name: string
  }
  dataReturnType: NonNullable<PluginOptions['options']['dataReturnType']>
  /**
   * This will make it possible to override the default behaviour.
   */
  Template?: React.ComponentType<TemplateProps>
}

export function QueryOptions({ factory, dataReturnType, Template = defaultTemplates.default }: Props): ReactNode {
  const {
    pluginManager,
    plugin: { key: pluginKey },
  } = useApp<PluginOptions>()
  const { getSchemas } = useOperationManager()
  const operation = useOperation()

  const schemas = getSchemas(operation)
  const name = pluginManager.resolveName({
    name: `${factory.name}QueryOptions`,
    pluginKey,
  })
  const contentType = operation.getContentType()

  const generics = new FunctionParams()
  const params = new FunctionParams()

  const clientGenerics = ['TData', `${factory.name}['error']`]
  const resultGenerics = ['TData', `${factory.name}['error']`]

  generics.add([{ type: 'TData', default: `${factory.name}['response']` }])

  params.add([
    ...getASTParams(schemas.pathParams, { typed: true }),
    {
      name: 'params',
      type: `${factory.name}['queryParams']`,
      enabled: !!schemas.queryParams?.name,
      required: false,
    },
    {
      name: 'headers',
      type: `${factory.name}['headerParams']`,
      enabled: !!schemas.headerParams?.name,
      required: false,
    },
    {
      name: 'options',
      type: `${factory.name}['client']['parameters']`,
      default: '{}',
    },
  ])

  const client = {
    withQueryParams: !!schemas.queryParams?.name,
    withData: !!schemas.request?.name,
    withPathParams: !!schemas.pathParams?.name,
    withHeaders: !!schemas.headerParams?.name,
    method: operation.method,
    path: new URLPath(operation.path),
    generics: clientGenerics.join(', '),
    contentType,
  }

  return (
    <Template
      name={name}
      params={params.toString()}
      generics={generics.toString()}
      returnType={`SWRConfiguration<${resultGenerics.join(', ')}>`}
      client={client}
      dataReturnType={dataReturnType}
    />
  )
}

QueryOptions.templates = defaultTemplates
