import { FunctionParams, transformers, URLPath } from '@kubb/core/utils'
import { Function } from '@kubb/react'
import { useOperation, useSchemas } from '@kubb/swagger/hooks'
import { getASTParams, getParams } from '@kubb/swagger/utils'

import { camelCase, pascalCase } from 'change-case'

import type { HttpMethod } from '@kubb/swagger'
import type { ReactNode } from 'react'
import type { Framework } from '../types.ts'

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
}

function Template({
  name,
  params,
  generics,
  returnType,
  JSDoc,
  hook,
  client,
}: TemplateProps): ReactNode {
  const clientParams = [
    `method: "${client.method}"`,
    `url: ${client.path.template}`,
    client.withQueryParams ? 'params' : undefined,
    client.withData ? 'data' : undefined,
    client.withHeaders ? 'headers: { ...headers, ...options.headers }' : undefined,
    '...options',
  ].filter(Boolean)

  const clientOptions = `${transformers.createIndent(4)}${clientParams.join(`,\n${transformers.createIndent(4)}`)}`

  return (
    <>
      <Function name={name} export generics={generics} returnType={returnType} params={params} JSDoc={JSDoc}>
        {`
       const queryKey = ${hook.queryKey}

       return {
         queryKey,
         queryFn: () => {
          ${hook.children || ''}
           return client<${client.generics}>({
            ${clientOptions}
           }).then(res => res?.data || res)
         },
       }

       `}
      </Function>
    </>
  )
}

type Props = {
  isV5: boolean
  resultType?: string
  factory: {
    name: string
  }
  /**
   * This will make it possible to override the default behaviour.
   */
  Template?: React.ComponentType<React.ComponentProps<typeof Template>>
}

const defaultTemplates = {
  get default() {
    return function({
      resultType = 'UseBaseQueryOptions',
      factory,
      Template: QueryTemplate = Template,
    }: Props): ReactNode {
      const schemas = useSchemas()
      const operation = useOperation()

      const name = camelCase(`${factory.name}QueryOptions`)
      const queryKey = camelCase(`${factory.name}QueryKey`)
      const queryKeyType = pascalCase(queryKey)

      const generics = new FunctionParams()
      const params = new FunctionParams()

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
          required: !!schemas.queryParams?.schema.required?.length,
        },
        {
          name: 'headers',
          type: `${factory.name}['headerParams']`,
          enabled: !!schemas.headerParams?.name,
          required: !!schemas.headerParams?.schema.required?.length,
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
        <QueryTemplate
          name={name}
          params={params.toString()}
          generics={generics.toString()}
          returnType={`${resultType}<${resultGenerics.join(', ')}>`}
          client={client}
          hook={hook}
        />
      )
    }
  },
  get react() {
    const Component = this.default

    return function(props: Props): ReactNode {
      return (
        <Component
          {...props}
          resultType={props.isV5 ? 'QueryObserverOptions' : 'UseBaseQueryOptions'}
        />
      )
    }
  },
  get solid() {
    const Component = this.default

    return function(props: Props): ReactNode {
      return (
        <Component
          {...props}
          resultType={'CreateQueryResult'}
        />
      )
    }
  },
  get svelte() {
    const Component = this.default

    return function(props: Props): ReactNode {
      return (
        <Component
          {...props}
          resultType={'CreateQueryResult'}
        />
      )
    }
  },
  get vue() {
    return function({
      isV5,
      factory,
      Template: QueryTemplate = Template,
    }: Props): ReactNode {
      const resultType = isV5 ? 'QueryObserverOptions' : 'VueQueryObserverOptions'
      const schemas = useSchemas()
      const operation = useOperation()

      const name = camelCase(`${factory.name}QueryOptions`)
      const queryKey = camelCase(`${factory.name}QueryKey`)
      const queryKeyType = pascalCase(queryKey)

      const generics = new FunctionParams()
      const params = new FunctionParams()

      const pathParams = getParams(schemas.pathParams, { override: (item) => ({ ...item, name: item.name ? `ref${pascalCase(item.name)}` : undefined }) })
        .toString()

      const clientGenerics = ['TQueryFnData', 'TError']
      const resultGenerics = [`${factory.name}['unionResponse']`, 'TError', 'TData', 'TQueryData', queryKeyType]
      const client = {
        withQueryParams: !!schemas.queryParams?.name,
        withData: !!schemas.request?.name,
        withPathParams: !!schemas.pathParams?.name,
        withHeaders: !!schemas.headerParams?.name,
        method: operation.method,
        path: new URLPath(operation.path),
        generics: clientGenerics.toString(),
      }

      generics.add([
        { type: `TQueryFnData extends ${factory.name}['data']`, default: `${factory.name}["data"]` },
        { type: 'TError', default: `${factory.name}["error"]` },
        { type: 'TData', default: `${factory.name}["response"]` },
        { type: 'TQueryData', default: `${factory.name}["response"]` },
      ])

      params.add([
        ...getASTParams(schemas.pathParams, {
          typed: true,
          override: (item) => ({ ...item, name: item.name ? `ref${pascalCase(item.name)}` : undefined, enabled: !!item.name, type: `MaybeRef<${item.type}>` }),
        }),
        {
          name: 'refParams',
          type: `MaybeRef<${schemas.queryParams?.name}>`,
          enabled: client.withQueryParams,
          required: !!schemas.queryParams?.schema.required?.length,
        },
        {
          name: 'refHeaders',
          type: `MaybeRef<${schemas.headerParams?.name}>`,
          enabled: client.withHeaders,
          required: !!schemas.headerParams?.schema.required?.length,
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
        <QueryTemplate
          name={name}
          params={params.toString()}
          generics={generics.toString()}
          returnType={`${resultType}<${resultGenerics.join(', ')}>`}
          client={client}
          hook={hook}
        />
      )
    }
  },
} as const

export function QueryOptions({ framework, ...rest }: Props & { framework: Framework }): ReactNode {
  const Template = defaultTemplates[framework]

  return <Template {...rest} />
}

QueryOptions.templates = defaultTemplates
