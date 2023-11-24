import transformers from '@kubb/core/transformers'
import { FunctionParams, URLPath } from '@kubb/core/utils'
import { Function, usePlugin, useResolveName } from '@kubb/react'
import { useOperation, useSchemas } from '@kubb/swagger/hooks'
import { getASTParams } from '@kubb/swagger/utils'

import type { HttpMethod } from '@kubb/swagger'
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
  }
  dataReturnType: NonNullable<PluginOptions['options']['dataReturnType']>
}

function Template({
  name,
  params,
  generics,
  returnType,
  JSDoc,
  client,
  dataReturnType,
}: TemplateProps): ReactNode {
  const clientOptions = [
    `method: "${client.method}"`,
    `url: ${client.path.template}`,
    client.withQueryParams ? 'params' : undefined,
    client.withData ? 'data' : undefined,
    client.withHeaders ? 'headers: { ...headers, ...options.headers }' : undefined,
    '...options',
  ].filter(Boolean)

  const resolvedClientOptions = `${transformers.createIndent(4)}${clientOptions.join(`,\n${transformers.createIndent(4)}`)}`

  return (
    <Function name={name} export generics={generics} returnType={returnType} params={params} JSDoc={JSDoc}>
      {`
      return {
        fetcher: () => {
          return client<${client.generics}>({
            ${resolvedClientOptions}
          }).then(res => ${dataReturnType === 'data' ? 'res.data' : 'res'})
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
  const { key: pluginKey } = usePlugin()
  const schemas = useSchemas()
  const operation = useOperation()

  const name = useResolveName({ name: `${factory.name}QueryOptions`, pluginKey, type: 'function' })

  const generics = new FunctionParams()
  const params = new FunctionParams()

  const resultGenerics = [dataReturnType === 'data' ? 'TData' : 'ResponseConfig<TData>', 'TError']

  generics.add([
    { type: 'TData', default: schemas.response.name },
    { type: 'TError', default: schemas.errors?.map((error) => error.name).join(' | ') || 'unknown' },
  ])

  params.add([
    ...getASTParams(schemas.pathParams, { typed: true }),
    {
      name: 'params',
      type: schemas.queryParams?.name,
      enabled: !!schemas.queryParams?.name,
      required: false,
    },
    {
      name: 'headers',
      type: schemas.headerParams?.name,
      enabled: !!schemas.headerParams?.name,
      required: false,
    },
    {
      name: 'options',
      type: `Partial<Parameters<typeof client>[0]>`,
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
    generics: ['TData', 'TError'].join(', '),
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
