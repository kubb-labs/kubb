import { PackageManager } from '@kubb/core'
import { FunctionParams, transformers, URLPath } from '@kubb/core/utils'
import { Function, usePlugin } from '@kubb/react'
import { useOperation, useResolveName, useSchemas } from '@kubb/swagger/hooks'
import { getASTParams, getParams } from '@kubb/swagger/utils'

import { camelCase, pascalCase } from 'change-case'

import type { HttpMethod } from '@kubb/swagger'
import type { ReactNode } from 'react'
import type { Infinite } from '../types.ts'

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
  }
  isV5: boolean
  infinite?: Infinite
}

function Template({
  name,
  params,
  generics,
  returnType,
  JSDoc,
  hook,
  client,
  infinite,
  isV5,
}: TemplateProps): ReactNode {
  const clientOptions = [
    `method: "${client.method}"`,
    `url: ${client.path.template}`,
    client.withQueryParams && !infinite ? 'params' : undefined,
    client.withData ? 'data' : undefined,
    client.withHeaders ? 'headers: { ...headers, ...options.headers }' : undefined,
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
    isV5 && !!infinite ? `getNextPageParam: (lastPage) => lastPage['${infinite.queryParam}']` : undefined,
  ].filter(Boolean)

  const resolvedClientOptions = `${transformers.createIndent(4)}${clientOptions.join(`,\n${transformers.createIndent(4)}`)}`
  const resolvedQueryOptions = `${transformers.createIndent(4)}${queryOptions.join(`,\n${transformers.createIndent(4)}`)}`

  if (infinite) {
    return (
      <Function name={name} export generics={generics} returnType={returnType} params={params} JSDoc={JSDoc}>
        {`
         const queryKey = ${hook.queryKey}

         return {
           queryKey,
           queryFn: ({ pageParam }) => {
            ${hook.children || ''}
             return client<${client.generics}>({
              ${resolvedClientOptions}
             }).then(res => res?.data || res)
           },
           ${resolvedQueryOptions}
         }

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
         queryFn: () => {
          ${hook.children || ''}
           return client<${client.generics}>({
            ${resolvedClientOptions}
           }).then(res => res?.data || res)
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
    return function(props: FrameworkProps): ReactNode {
      return (
        <Template
          {...props}
        />
      )
    }
  },
  get solid() {
    return function(props: FrameworkProps): ReactNode {
      return (
        <Template
          {...props}
        />
      )
    }
  },
  get svelte() {
    return function(props: FrameworkProps): ReactNode {
      return (
        <Template
          {...props}
        />
      )
    }
  },
  get vue() {
    return function(
      { client, context, ...rest }: FrameworkProps,
    ): ReactNode {
      const { factory, queryKey } = context

      const schemas = useSchemas()
      const params = new FunctionParams()

      const pathParams = getParams(schemas.pathParams, { override: (item) => ({ ...item, name: item.name ? `ref${pascalCase(item.name)}` : undefined }) })
        .toString()

      params.add([
        ...getASTParams(schemas.pathParams, {
          typed: true,
          override: (item) => ({ ...item, name: item.name ? `ref${pascalCase(item.name)}` : undefined, enabled: !!item.name, type: `MaybeRef<${item.type}>` }),
        }),
        {
          name: 'refParams',
          type: `MaybeRef<${schemas.queryParams?.name}>`,
          enabled: client.withQueryParams,
          required: Array.isArray(schemas.queryParams?.schema.required)
            ? !!schemas.queryParams?.schema.required?.length
            : !!schemas.queryParams?.schema.required,
        },
        {
          name: 'refHeaders',
          type: `MaybeRef<${schemas.headerParams?.name}>`,
          enabled: client.withHeaders,
          required: Array.isArray(schemas.headerParams?.schema.required)
            ? !!schemas.headerParams?.schema.required?.length
            : !!schemas.headerParams?.schema.required,
        },
        {
          name: 'options',
          type: `${factory.name}['client']['paramaters']`,
          default: '{}',
        },
      ])

      const unrefs = params.items
        .filter((item) => item.enabled)
        .map((item) => {
          return item.name ? `const ${camelCase(item.name.replace('ref', ''))} = unref(${item.name})` : undefined
        })
        .join('\n')

      const hook = {
        queryKey: `${queryKey}(${client.withPathParams ? `${pathParams}, ` : ''}${client.withQueryParams ? ('refParams') : ''})`,
        children: unrefs,
      }

      return (
        <Template
          {...rest}
          params={params.toString()}
          hook={hook}
          client={client}
        />
      )
    }
  },
} as const

type Props = {
  infinite: Infinite | undefined
  factory: {
    name: string
  }
  resultType: string
  /**
   * This will make it possible to override the default behaviour.
   */
  Template?: React.ComponentType<FrameworkProps>
}

export function QueryOptions({ factory, infinite, resultType, Template = defaultTemplates.react }: Props): ReactNode {
  const { key: pluginKey } = usePlugin()
  const schemas = useSchemas()
  const operation = useOperation()

  const name = useResolveName({ name: `${factory.name}QueryOptions`, pluginKey })
  const queryKey = useResolveName({ name: `${factory.name}QueryKey`, pluginKey })
  const queryKeyType = useResolveName({ name: `${factory.name}QueryKey`, type: 'type', pluginKey })

  const generics = new FunctionParams()
  const params = new FunctionParams()
  const isV5 = new PackageManager().isValidSync(/@tanstack/, '>=5')

  const pathParams = getParams(schemas.pathParams, {}).toString()

  const clientGenerics = ['TQueryFnData', 'TError']
  const resultGenerics = [`${factory.name}['unionResponse']`, 'TError', 'TData', 'TQueryData', queryKeyType]

  generics.add([
    { type: `TQueryFnData extends ${factory.name}['data']`, default: `${factory.name}["data"]` },
    { type: 'TError', default: `${factory.name}["error"]` },
    { type: 'TData', default: `${factory.name}["response"]` },
    { type: 'TQueryData', default: `${factory.name}["response"]` },
  ])

  params.add([
    ...getASTParams(schemas.pathParams, {
      typed: true,
    }),
    {
      name: 'params',
      type: `${factory.name}['queryParams']`,
      enabled: !!schemas.queryParams?.name,
      required: Array.isArray(schemas.queryParams?.schema.required) ? !!schemas.queryParams?.schema.required?.length : !!schemas.queryParams?.schema.required,
    },
    {
      name: 'headers',
      type: `${factory.name}['headerParams']`,
      enabled: !!schemas.headerParams?.name,
      required: Array.isArray(schemas.headerParams?.schema.required)
        ? !!schemas.headerParams?.schema.required?.length
        : !!schemas.headerParams?.schema.required,
    },
    {
      name: 'options',
      type: `${factory.name}['client']['paramaters']`,
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
    generics: clientGenerics.toString(),
  }

  const hook = {
    queryKey: `${queryKey}(${client.withPathParams ? `${pathParams}, ` : ''}${client.withQueryParams ? ('params') : ''})`,
  }

  return (
    <Template
      name={name}
      params={params.toString()}
      generics={generics.toString()}
      returnType={`${resultType}<${resultGenerics.join(', ')}>`}
      client={client}
      hook={hook}
      isV5={isV5}
      infinite={infinite}
      context={{
        factory,
        queryKey,
      }}
    />
  )
}

QueryOptions.templates = defaultTemplates
