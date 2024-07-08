import transformers from '@kubb/core/transformers'
import { FunctionParams, URLPath } from '@kubb/core/utils'
import { useOperation, useOperationManager } from '@kubb/plugin-oas/hooks'
import { getASTParams } from '@kubb/plugin-oas/utils'
import { Function, useApp } from '@kubb/react'
import { pluginZodName } from '@kubb/swagger-zod'

import type { HttpMethod } from '@kubb/oas'
import type { ReactNode } from 'react'
import type { PluginSwr } from '../types.ts'
import { pluginTsName } from '@kubb/swagger-ts'

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
  dataReturnType: NonNullable<PluginSwr['options']['dataReturnType']>
  parser: string | undefined
}

function Template({ name, params, generics, returnType, JSDoc, client, dataReturnType, parser }: TemplateProps): ReactNode {
  const isFormData = client.contentType === 'multipart/form-data'
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
    client.withData && !isFormData ? 'data' : undefined,
    client.withData && isFormData ? 'data: formData' : undefined,
    headers.length ? `headers: { ${headers}, ...options.headers }` : undefined,
    '...options',
  ].filter(Boolean)

  const resolvedClientOptions = `${transformers.createIndent(4)}${clientOptions.join(`,\n${transformers.createIndent(4)}`)}`

  let returnRes = parser ? `return ${parser}(res.data)` : 'return res.data'

  if (dataReturnType === 'full') {
    returnRes = parser ? `return {...res, data: ${parser}(res.data)}` : 'return res'
  }

  const formData = isFormData
    ? `
   const formData = new FormData()
   if(data) {
    Object.keys(data).forEach((key) => {
      const value = data[key];
      if (typeof key === "string" && (typeof value === "string" || value instanceof Blob)) {
        formData.append(key, value);
      }
    })
   }
  `
    : undefined

  return (
    <Function name={name} export generics={generics} returnType={returnType} params={params} JSDoc={JSDoc}>
      {`
      return {
        fetcher: async () => {
          ${formData || ''}
          const res = await client<${client.generics}>({
            ${resolvedClientOptions}
          })

         ${returnRes}
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
  dataReturnType: NonNullable<PluginSwr['options']['dataReturnType']>
  /**
   * This will make it possible to override the default behaviour.
   */
  Template?: React.ComponentType<TemplateProps>
}

export function QueryOptions({ factory, dataReturnType, Template = defaultTemplates.default }: Props): ReactNode {
  const {
    pluginManager,
    plugin: {
      key: pluginKey,
      options: { parser },
    },
  } = useApp<PluginSwr>()
  const { getSchemas } = useOperationManager()
  const operation = useOperation()

  const schemas = getSchemas(operation, { pluginKey: [pluginTsName], type: 'type' })
  const zodSchemas = getSchemas(operation, { pluginKey: [pluginZodName], type: 'function' })
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
      parser={parser === 'zod' ? `${zodSchemas.response.name}.parse` : undefined}
    />
  )
}

QueryOptions.templates = defaultTemplates
