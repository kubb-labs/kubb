import { PackageManager } from '@kubb/core'
import transformers from '@kubb/core/transformers'
import { FunctionParams, URLPath } from '@kubb/core/utils'
import { useOperation, useOperationManager } from '@kubb/plugin-oas/hooks'
import { getASTParams } from '@kubb/plugin-oas/utils'
import { Function, useApp } from '@kubb/react'
import { pluginZodName } from '@kubb/swagger-zod'

import { isRequired } from '@kubb/oas'
import type { HttpMethod } from '@kubb/oas'
import type { ReactNode } from 'react'
import type { Infinite, PluginTanstackQuery, Suspense } from '../types.ts'
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
  hook: {
    queryKey: string
    children?: string
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
  infinite: Infinite | false
  dataReturnType: NonNullable<PluginTanstackQuery['options']['dataReturnType']>
  parser: string | undefined
}

function Template({ name, params, generics, returnType, JSDoc, hook, client, infinite, dataReturnType, parser }: TemplateProps): ReactNode {
  const isV5 = new PackageManager().isValidSync(/@tanstack/, '>=5')
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
    client.withQueryParams && !infinite ? 'params' : undefined,
    client.withData && !isFormData ? 'data' : undefined,
    client.withData && isFormData ? 'data: formData' : undefined,
    headers.length ? `headers: { ${headers}, ...options.headers }` : undefined,
    '...options',
    client.withQueryParams && !!infinite
      ? `params: {
      ...params,
      ['${infinite.queryParam}']: pageParam,
      ...(options.params || {}),
    }`
      : undefined,
  ].filter(Boolean)

  const queryOptions = [
    isV5 && !!infinite ? `initialPageParam: ${infinite.initialPageParam}` : undefined,
    isV5 && !!infinite && !!infinite.cursorParam ? `getNextPageParam: (lastPage) => lastPage['${infinite.cursorParam}']` : undefined,
    isV5 && !!infinite && !!infinite.cursorParam ? `getPreviousPageParam: (firstPage) => firstPage['${infinite.cursorParam}']` : undefined,
    isV5 && !!infinite && !infinite.cursorParam && dataReturnType === 'full'
      ? 'getNextPageParam: (lastPage, _allPages, lastPageParam) => Array.isArray(lastPage.data) && lastPage.data.length === 0 ? undefined : lastPageParam + 1'
      : undefined,
    isV5 && !!infinite && !infinite.cursorParam && dataReturnType === 'data'
      ? 'getNextPageParam: (lastPage, _allPages, lastPageParam) => Array.isArray(lastPage) && lastPage.length === 0 ? undefined : lastPageParam + 1'
      : undefined,
    isV5 && !!infinite && !infinite.cursorParam
      ? 'getPreviousPageParam: (_firstPage, _allPages, firstPageParam) => firstPageParam <= 1 ? undefined : firstPageParam - 1'
      : undefined,
  ].filter(Boolean)

  const resolvedClientOptions = `${transformers.createIndent(4)}${clientOptions.join(`,\n${transformers.createIndent(4)}`)}`
  const resolvedQueryOptions = `${transformers.createIndent(4)}${queryOptions.join(`,\n${transformers.createIndent(4)}`)}`

  let returnRes = parser ? `return ${parser}(res.data)` : 'return res.data'

  if (dataReturnType === 'full') {
    returnRes = parser ? `return {...res, data: ${parser}(res.data)}` : 'return res'
  }

  const formData = isFormData
    ? `
   const formData = new FormData()
   if(data) {
     Object.keys(data).forEach(key => formData.append(key, data[key]))
   }
  `
    : undefined

  if (infinite) {
    if (isV5) {
      return (
        <Function name={name} export params={params} JSDoc={JSDoc}>
          {`
       const queryKey = ${hook.queryKey}

       return infiniteQueryOptions({
         queryKey,
         queryFn: async ({ pageParam }) => {
          ${hook.children || ''}
          ${formData || ''}
           const res = await client<${client.generics}>({
            ${resolvedClientOptions}
           })

           ${returnRes}
         },
         ${resolvedQueryOptions}
       })

       `}
        </Function>
      )
    }

    return (
      <Function name={name} export generics={generics} returnType={returnType} params={params} JSDoc={JSDoc}>
        {`
         const queryKey = ${hook.queryKey}

         return {
           queryKey,
           queryFn: async ({ pageParam }) => {
             ${hook.children || ''}
             ${formData || ''}
             const res = await client<${client.generics}>({
              ${resolvedClientOptions}
             })

             ${returnRes}
           },
           ${resolvedQueryOptions}
         }

         `}
      </Function>
    )
  }

  if (isV5) {
    return (
      <Function name={name} export params={params} JSDoc={JSDoc}>
        {`
   const queryKey = ${hook.queryKey}

   return queryOptions({
     queryKey,
     queryFn: async () => {
       ${hook.children || ''}
       ${formData || ''}
       const res = await client<${client.generics}>({
        ${resolvedClientOptions}
       })

       ${returnRes}
     },
     ${resolvedQueryOptions}
   })

   `}
      </Function>
    )
  }

  return (
    <Function name={name} export generics={generics} returnType={returnType} params={params} JSDoc={JSDoc}>
      {`
       const queryKey = ${hook.queryKey}

       return {
         queryKey,
         queryFn: async () => {
           ${hook.children || ''}
           ${formData || ''}
           const res = await client<${client.generics}>({
            ${resolvedClientOptions}
           })

           ${returnRes}
         },
         ${resolvedQueryOptions}
       }

       `}
    </Function>
  )
}

type FrameworkProps = TemplateProps & {
  context: {
    factory: {
      name: string
    }
    queryKey: string
  }
}

const defaultTemplates = {
  get react() {
    return function (props: FrameworkProps): ReactNode {
      return <Template {...props} />
    }
  },
  get solid() {
    return function (props: FrameworkProps): ReactNode {
      return <Template {...props} />
    }
  },
  get svelte() {
    return function (props: FrameworkProps): ReactNode {
      return <Template {...props} />
    }
  },
  get vue() {
    return function ({ client, context, ...rest }: FrameworkProps): ReactNode {
      const { factory, queryKey } = context

      const {
        plugin: {
          options: { pathParamsType },
        },
      } = useApp<PluginTanstackQuery>()

      const { getSchemas } = useOperationManager()
      const operation = useOperation()

      const schemas = getSchemas(operation, { pluginKey: [pluginTsName], type: 'type' })
      const params = new FunctionParams()
      const queryKeyParams = new FunctionParams()

      params.add([
        ...(pathParamsType === 'object'
          ? [
              getASTParams(schemas.pathParams, {
                typed: true,
                override: (item) => ({
                  ...item,
                  name: item.name ? `ref${transformers.pascalCase(item.name)}` : undefined,
                  type: `MaybeRef<${item.type}>`,
                }),
              }),
            ]
          : getASTParams(schemas.pathParams, {
              typed: true,
              override: (item) => ({
                ...item,
                name: item.name ? `ref${transformers.pascalCase(item.name)}` : undefined,
                type: `MaybeRef<${item.type}>`,
              }),
            })),
        {
          name: 'refParams',
          type: `MaybeRef<${schemas.queryParams?.name}>`,
          enabled: client.withQueryParams,
          required: isRequired(schemas.queryParams?.schema),
        },
        {
          name: 'refHeaders',
          type: `MaybeRef<${schemas.headerParams?.name}>`,
          enabled: client.withHeaders,
          required: isRequired(schemas.headerParams?.schema),
        },
        {
          name: 'refData',
          type: `MaybeRef<${schemas.request?.name}>`,
          enabled: client.withData,
          required: isRequired(schemas.request?.schema),
        },
        {
          name: 'options',
          type: `${factory.name}['client']['parameters']`,
          default: '{}',
        },
      ])

      queryKeyParams.add([
        ...(pathParamsType === 'object'
          ? [
              getASTParams(schemas.pathParams, {
                override: (item) => ({
                  ...item,
                  name: item.name ? `ref${transformers.pascalCase(item.name)}` : undefined,
                }),
              }),
            ]
          : getASTParams(schemas.pathParams, {
              override: (item) => ({
                ...item,
                name: item.name ? `ref${transformers.pascalCase(item.name)}` : undefined,
              }),
            })),
        {
          name: 'refParams',
          enabled: client.withQueryParams,
          required: isRequired(schemas.queryParams?.schema),
        },
        {
          name: 'refData',
          enabled: client.withData,
          required: isRequired(schemas.request?.schema),
        },
      ])

      const unrefs = params.items
        .filter((item) => item.enabled)
        .map((item) => {
          return item.name ? `const ${transformers.camelCase(item.name.replace('ref', ''))} = unref(${item.name})` : undefined
        })
        .join('\n')

      const hook = {
        queryKey: `${queryKey}(${queryKeyParams.toString()})`,
        children: unrefs,
      }

      return <Template {...rest} params={params.toString()} hook={hook} client={client} />
    }
  },
} as const

type Props = {
  infinite: Infinite | false
  suspense: Suspense | false
  factory: {
    name: string
  }
  resultType: string
  /**
   * This will make it possible to override the default behaviour.
   */
  Template?: React.ComponentType<FrameworkProps>
  dataReturnType: NonNullable<PluginTanstackQuery['options']['dataReturnType']>
}

export function QueryOptions({ factory, infinite, suspense, resultType, dataReturnType, Template = defaultTemplates.react }: Props): ReactNode {
  const {
    pluginManager,
    plugin: {
      key: pluginKey,
      options: { parser, pathParamsType, queryOptions },
    },
  } = useApp<PluginTanstackQuery>()

  const { getSchemas } = useOperationManager()
  const operation = useOperation()

  const contentType = operation.getContentType()
  const schemas = getSchemas(operation, { pluginKey: [pluginTsName], type: 'type' })
  const zodSchemas = getSchemas(operation, { pluginKey: [pluginZodName], type: 'function' })

  const queryKey = pluginManager.resolveName({
    name: [factory.name, infinite ? 'Infinite' : undefined, suspense ? 'Suspense' : undefined, 'QueryKey'].filter(Boolean).join(''),
    pluginKey,
  })
  const queryOptionsName = pluginManager.resolveName({
    name: [factory.name, infinite ? 'Infinite' : undefined, suspense ? 'Suspense' : undefined, 'QueryOptions'].filter(Boolean).join(''),
    pluginKey,
  })

  const generics = new FunctionParams()
  const params = new FunctionParams()
  const queryKeyParams = new FunctionParams()

  const clientGenerics = [`${factory.name}['data']`, `${factory.name}['error']`]
  // suspense is having 4 generics instead of 5, TQueryData is not needed because data will always be defined
  const resultGenerics = suspense
    ? [`${factory.name}['response']`, `${factory.name}["error"]`, 'TData']
    : [`${factory.name}['response']`, `${factory.name}["error"]`, 'TData', 'TQueryData']

  const client = {
    withQueryParams: !!schemas.queryParams?.name,
    withData: !!schemas.request?.name,
    withPathParams: !!schemas.pathParams?.name,
    withHeaders: !!schemas.headerParams?.name,
    method: operation.method,
    path: new URLPath(operation.path),
    generics: clientGenerics.toString(),
    contentType,
  }

  generics.add([
    { type: 'TData', default: `${factory.name}["response"]` },
    suspense ? undefined : { type: 'TQueryData', default: `${factory.name}["response"]` },
  ])

  params.add([
    ...(pathParamsType === 'object' ? [getASTParams(schemas.pathParams, { typed: true })] : getASTParams(schemas.pathParams, { typed: true })),
    {
      name: 'params',
      type: `${factory.name}['queryParams']`,
      enabled: client.withQueryParams,
      required: isRequired(schemas.queryParams?.schema),
    },
    {
      name: 'headers',
      type: `${factory.name}['headerParams']`,
      enabled: client.withHeaders,
      required: isRequired(schemas.headerParams?.schema),
    },
    {
      name: 'data',
      type: `${factory.name}['request']`,
      enabled: client.withData,
      required: isRequired(schemas.request?.schema),
    },
    {
      name: 'options',
      type: `${factory.name}['client']['parameters']`,
      default: '{}',
    },
  ])

  queryKeyParams.add([
    ...(pathParamsType === 'object' ? [getASTParams(schemas.pathParams)] : getASTParams(schemas.pathParams)),
    {
      name: 'params',
      enabled: client.withQueryParams,
      required: isRequired(schemas.queryParams?.schema),
    },
    {
      name: 'data',
      enabled: client.withData,
      required: isRequired(schemas.request?.schema),
    },
  ])

  const hook = {
    queryKey: `${queryKey}(${queryKeyParams.toString()})`,
  }

  if (!queryOptions) {
    return null
  }

  return (
    <Template
      name={queryOptionsName}
      params={params.toString()}
      generics={generics.toString()}
      returnType={`WithRequired<${resultType}<${resultGenerics.join(', ')}>, 'queryKey'>`}
      client={client}
      hook={hook}
      infinite={infinite}
      dataReturnType={dataReturnType}
      parser={parser === 'zod' ? `${zodSchemas.response.name}.parse` : undefined}
      context={{
        factory,
        queryKey,
      }}
    />
  )
}

QueryOptions.templates = defaultTemplates
