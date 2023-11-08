import path from 'node:path'

import { PackageManager } from '@kubb/core'
import { FunctionParams, getRelativePath, transformers, URLPath } from '@kubb/core/utils'
import { File, Function, Type, usePlugin, usePluginManager } from '@kubb/react'
import { useOperation, useResolve, useSchemas } from '@kubb/swagger/hooks'
import { getASTParams, getComments, getParams } from '@kubb/swagger/utils'
import { useResolve as useResolveType } from '@kubb/swagger-ts/hooks'

import { camelCase, capitalCase, capitalCaseTransform, pascalCase } from 'change-case'

import { QueryKeyFunction } from './QueryKeyFunction.tsx'

import type { HttpMethod, OperationSchemas } from '@kubb/swagger'
import type { ReactNode } from 'react'
import type { FileMeta, Framework, PluginOptions } from '../types.ts'

type QueryTemplateProps = {
  name: string
  hookName: string
  hookGenerics: string
  params: string
  generics?: string
  returnType: string
  clientGenerics: string
  comments: string[]
  method: HttpMethod
  withQueryParams: boolean
  withPathParams: boolean
  withData: boolean
  withHeaders: boolean
  path: URLPath
  isV5: boolean
  factory: {
    name: string
    Generics: [data: string, error: string, request: string, pathParams: string, queryParams: string, headerParams: string, response: string, options: string]
  }
  children?: string

  queryKey: string
  queryOptions: string
}

Query.Template = function({
  name,
  hookName,
  generics,
  returnType,
  params,
  comments,
  clientGenerics,
  factory,
  method,
  path,
  withData,
  withHeaders,
  withQueryParams,
  hookGenerics,
  queryKey,
  queryOptions,
  children,
}: QueryTemplateProps): ReactNode {
  const clientParams = [
    `method: "${method}"`,
    `url: ${path.template}`,
    withQueryParams ? 'params' : undefined,
    withData ? 'data' : undefined,
    withHeaders ? 'headers: { ...headers, ...clientOptions.headers }' : undefined,
    '...clientOptions',
  ].filter(Boolean)
  const resolvedReturnType = `${returnType} & { queryKey: TQueryKey }`

  return (
    <>
      <Type name={factory.name}>
        {`KubbQueryFactory<${factory.Generics.join(', ')}>`}
      </Type>
      <br />
      <Function name={name} export generics={generics} returnType={resolvedReturnType} params={params} JSDoc={{ comments }}>
        {`
       const { Query: QueryOptions, client: clientOptions = {} } = options ?? {}
       const queryKey = queryOptions?.queryKey ?? ${queryKey}

       return ${hookName}<${hookGenerics}>({
         queryFn: (${withData ? 'data' : ''}) => {
          ${children || ''}
           return client<${clientGenerics}>({
            ${transformers.createIndent(4)}${clientParams.join(`,\n${transformers.createIndent(4)}`)}
           }).then(res => res as TData)
         },
         ...QueryOptions
       })

       const query = ${hookName}<${hookGenerics}>({
        ...${queryOptions},
        queryKey,
        ...queryOptions
      }) as ${resolvedReturnType}

      query.queryKey = queryKey as TQueryKey

      return query

       `}
      </Function>
    </>
  )
}

type QueryTemplateFrameworkProps =
  & Omit<QueryTemplateProps, 'returnType' | 'hookName' | 'params' | 'clientGenerics' | 'hookGenerics' | 'queryKey' | 'queryOptions'>
  & {
    schemas: OperationSchemas
  }

Query.TemplateReact = function(
  { isV5, schemas, withData, withPathParams, withHeaders, withQueryParams, factory, ...rest }: QueryTemplateFrameworkProps,
): ReactNode {
  const hookName = 'useQuery'
  const resultType = 'UseQueryResult'
  const optionsType = isV5 ? 'QueryObserverOptions' : 'UseBaseQueryOptions'
  const queryKey = camelCase(`${factory.name}QueryKey`)

  const params = new FunctionParams()
  const queryParams = new FunctionParams()

  const pathParams = getParams(schemas.pathParams, {}).toString()

  const clientGenerics = [
    `${factory.name}["data"]`,
    'TError',
    withData ? `${factory.name}["request"]` : 'void',
  ]

  const hookGenerics = [isV5 ? 'any' : 'TQueryFnData', 'TError', 'TData', 'any']

  const resultGenerics = [
    'TData',
    'TError',
  ]

  // only needed for the options to override the useQuery options/params
  const queryOptionsOverrideGenerics = ['TQueryFnData', 'TError', 'TData', 'TQueryData', 'TQueryKey']
  const queryOptionsGenerics = ['TQueryFnData', 'TError', 'TData', 'TQueryData']

  params.add([
    ...getASTParams(schemas.pathParams, {
      typed: true,
    }),
    {
      name: 'params',
      type: `${factory.name}['queryParams']`,
      enabled: withQueryParams,
      required: !!schemas.queryParams?.schema.required?.length,
    },
    {
      name: 'headers',
      type: `${factory.name}['headerParams']`,
      enabled: withHeaders,
      required: !!schemas.headerParams?.schema.required?.length,
    },
    {
      name: 'options',
      type: `{
        Query?: ${optionsType}<${queryOptionsOverrideGenerics.join(', ')}>,
        client?: ${factory.name}['client']['paramaters']
    }`,
      default: '{}',
    },
  ])

  queryParams.add([
    ...getASTParams(schemas.pathParams, {
      typed: false,
    }),
    {
      name: 'params',
      enabled: withQueryParams,
      required: !!schemas.queryParams?.schema.required?.length,
    },
    {
      name: 'headers',
      enabled: withHeaders,
      required: !!schemas.headerParams?.schema.required?.length,
    },
    {
      name: 'clientOptions',
      required: false,
    },
  ])

  return (
    <>
      <QueryKeyFunction.react
        factoryTypeName={factory.name}
        name={queryKey}
        typeName={capitalCase(queryKey, { delimiter: '', transform: capitalCaseTransform })}
      />
      <Query.Template
        {...rest}
        isV5={isV5}
        params={params.toString()}
        clientGenerics={clientGenerics.toString()}
        hookGenerics={hookGenerics.join(', ')}
        factory={factory}
        withData={withData}
        withHeaders={withHeaders}
        withPathParams={withPathParams}
        withQueryParams={withQueryParams}
        hookName={hookName}
        returnType={`${resultType}<${resultGenerics.join(', ')}`}
        queryOptions={`${camelCase(`${factory.name}QueryOptions`)}<${queryOptionsGenerics.join(', ')}>(${queryParams.toString()})`}
        queryKey={`${queryKey}(${withPathParams ? `${pathParams}, ` : ''}${withQueryParams ? ('params') : ''})`}
      />
    </>
  )
}

Query.TemplateSolid = function(
  { isV5, schemas, withData, withPathParams, withHeaders, withQueryParams, factory, ...rest }: QueryTemplateFrameworkProps,
): ReactNode {
  const hookName = 'createQuery'
  const resultType = 'CreateQueryResult'
  const optionsType = 'CreateBaseQueryOptions'
  const queryKey = camelCase(`${factory.name}QueryKey`)

  const params = new FunctionParams()
  const queryParams = new FunctionParams()

  const pathParams = getParams(schemas.pathParams, {}).toString()

  const clientGenerics = [
    `${factory.name}["data"]`,
    'TError',
    withData ? `${factory.name}["request"]` : 'void',
  ]

  const hookGenerics = [isV5 ? 'any' : 'TQueryFnData', 'TError', 'TData', 'any']

  const resultGenerics = [
    'TData',
    'TError',
  ]

  // only needed for the options to override the useQuery options/params
  const queryOptionsOverrideGenerics = ['TQueryFnData', 'TError', 'TData', 'TQueryData', 'TQueryKey']
  const queryOptionsGenerics = ['TQueryFnData', 'TError', 'TData', 'TQueryData']

  params.add([
    ...getASTParams(schemas.pathParams, {
      typed: true,
    }),
    {
      name: 'params',
      type: `${factory.name}['queryParams']`,
      enabled: withQueryParams,
      required: !!schemas.queryParams?.schema.required?.length,
    },
    {
      name: 'headers',
      type: `${factory.name}['headerParams']`,
      enabled: withHeaders,
      required: !!schemas.headerParams?.schema.required?.length,
    },
    {
      name: 'options',
      type: `{
        Query?: ${optionsType}<${queryOptionsOverrideGenerics.join(', ')}>,
        client?: ${factory.name}['client']['paramaters']
    }`,
      default: '{}',
    },
  ])

  queryParams.add([
    ...getASTParams(schemas.pathParams, {
      typed: false,
    }),
    {
      name: 'params',
      enabled: withQueryParams,
      required: !!schemas.queryParams?.schema.required?.length,
    },
    {
      name: 'headers',
      enabled: withHeaders,
      required: !!schemas.headerParams?.schema.required?.length,
    },
    {
      name: 'clientOptions',
      required: false,
    },
  ])

  return (
    <>
      <QueryKeyFunction.solid
        factoryTypeName={factory.name}
        name={queryKey}
        typeName={capitalCase(queryKey, { delimiter: '', transform: capitalCaseTransform })}
      />
      <Query.Template
        {...rest}
        isV5={isV5}
        params={params.toString()}
        clientGenerics={clientGenerics.toString()}
        hookGenerics={hookGenerics.join(', ')}
        factory={factory}
        withData={withData}
        withHeaders={withHeaders}
        withPathParams={withPathParams}
        withQueryParams={withQueryParams}
        hookName={hookName}
        returnType={`${resultType}<${resultGenerics.join(', ')}`}
        queryOptions={`${camelCase(`${factory.name}QueryOptions`)}<${queryOptionsGenerics.join(', ')}>(${queryParams.toString()})`}
        queryKey={`() => ${queryKey}(${withPathParams ? `${pathParams}, ` : ''}${withQueryParams ? ('params') : ''})`}
      />
    </>
  )
}

Query.TemplateSvelte = function(
  { isV5, schemas, withData, withPathParams, withHeaders, withQueryParams, factory, ...rest }: QueryTemplateFrameworkProps,
): ReactNode {
  const hookName = 'createQuery'
  const resultType = 'CreateQueryResult'
  const optionsType = 'CreateBaseQueryOptions'
  const queryKey = camelCase(`${factory.name}QueryKey`)

  const params = new FunctionParams()
  const queryParams = new FunctionParams()

  const pathParams = getParams(schemas.pathParams, {}).toString()

  const clientGenerics = [
    `${factory.name}["data"]`,
    'TError',
    withData ? `${factory.name}["request"]` : 'void',
  ]

  const hookGenerics = [isV5 ? 'any' : 'TQueryFnData', 'TError', 'TData', 'any']

  const resultGenerics = [
    'TData',
    'TError',
  ]

  // only needed for the options to override the useQuery options/params
  const queryOptionsOverrideGenerics = ['TQueryFnData', 'TError', 'TData', 'TQueryData', 'TQueryKey']
  const queryOptionsGenerics = ['TQueryFnData', 'TError', 'TData', 'TQueryData']

  params.add([
    ...getASTParams(schemas.pathParams, {
      typed: true,
    }),
    {
      name: 'params',
      type: `${factory.name}['queryParams']`,
      enabled: withQueryParams,
      required: !!schemas.queryParams?.schema.required?.length,
    },
    {
      name: 'headers',
      type: `${factory.name}['headerParams']`,
      enabled: withHeaders,
      required: !!schemas.headerParams?.schema.required?.length,
    },
    {
      name: 'options',
      type: `{
        Query?: ${optionsType}<${queryOptionsOverrideGenerics.join(', ')}>,
        client?: ${factory.name}['client']['paramaters']
    }`,
      default: '{}',
    },
  ])

  queryParams.add([
    ...getASTParams(schemas.pathParams, {
      typed: false,
    }),
    {
      name: 'params',
      enabled: withQueryParams,
      required: !!schemas.queryParams?.schema.required?.length,
    },
    {
      name: 'headers',
      enabled: withHeaders,
      required: !!schemas.headerParams?.schema.required?.length,
    },
    {
      name: 'clientOptions',
      required: false,
    },
  ])

  return (
    <>
      <QueryKeyFunction.svelte
        factoryTypeName={factory.name}
        name={queryKey}
        typeName={capitalCase(queryKey, { delimiter: '', transform: capitalCaseTransform })}
      />
      <Query.Template
        {...rest}
        isV5={isV5}
        params={params.toString()}
        clientGenerics={clientGenerics.toString()}
        hookGenerics={hookGenerics.join(', ')}
        factory={factory}
        withData={withData}
        withHeaders={withHeaders}
        withPathParams={withPathParams}
        withQueryParams={withQueryParams}
        hookName={hookName}
        returnType={`${resultType}<${resultGenerics.join(', ')}`}
        queryOptions={`${camelCase(`${factory.name}QueryOptions`)}<${queryOptionsGenerics.join(', ')}>(${queryParams.toString()})`}
        queryKey={`${queryKey}(${withPathParams ? `${pathParams}, ` : ''}${withQueryParams ? ('params') : ''})`}
      />
    </>
  )
}

Query.TemplateVue = function(
  { isV5, schemas, withData, withPathParams, withHeaders, withQueryParams, factory, ...rest }: QueryTemplateFrameworkProps,
): ReactNode {
  const hookName = 'useQuery'
  const resultType = 'UseQueryReturnType'
  const optionsType = isV5 ? 'QueryObserverOptions' : 'VueQueryObserverOptions'
  const queryKey = camelCase(`${factory.name}QueryKey`)

  const params = new FunctionParams()
  const queryParams = new FunctionParams()

  const pathParams = getParams(schemas.pathParams, {}).toString()

  const clientGenerics = [
    `${factory.name}["data"]`,
    'TError',
    withData ? `${factory.name}["request"]` : 'void',
  ]

  const hookGenerics = [isV5 ? 'any' : 'TQueryFnData', 'TError', 'TData', 'any']

  const resultGenerics = [
    'TData',
    'TError',
  ]

  // only needed for the options to override the useQuery options/params
  const queryOptionsOverrideGenerics = ['TQueryFnData', 'TError', 'TData', 'TQueryData', 'TQueryKey']
  const queryOptionsGenerics = ['TQueryFnData', 'TError', 'TData', 'TQueryData']

  params.add([
    ...getASTParams(schemas.pathParams, {
      typed: true,
      override: (item) => ({ ...item, name: item.name ? `ref${pascalCase(item.name)}` : undefined }),
    }),
    {
      name: 'refParams',
      type: `MaybeRef<${schemas.queryParams?.name}>`,
      enabled: withQueryParams,
      required: !!schemas.queryParams?.schema.required?.length,
    },
    {
      name: 'refHeaders',
      type: `MaybeRef<${schemas.headerParams?.name}>`,
      enabled: withHeaders,
      required: !!schemas.headerParams?.schema.required?.length,
    },
    {
      name: 'options',
      type: `{
        Query?: ${optionsType}<${queryOptionsOverrideGenerics.join(', ')}>,
        client?: ${factory.name}['client']['paramaters']
    }`,
      default: '{}',
    },
  ])

  queryParams.add([
    ...getASTParams(schemas.pathParams, {
      typed: false,
      override: (item) => ({ ...item, name: item.name ? `ref${pascalCase(item.name)}` : undefined }),
    }),
    {
      name: 'refParams',
      enabled: withQueryParams,
      required: !!schemas.queryParams?.schema.required?.length,
    },
    {
      name: 'refHeaders',
      enabled: withHeaders,
      required: !!schemas.headerParams?.schema.required?.length,
    },
    {
      name: 'clientOptions',
      required: false,
    },
  ])

  return (
    <>
      <QueryKeyFunction.vue
        factoryTypeName={factory.name}
        name={queryKey}
        typeName={capitalCase(queryKey, { delimiter: '', transform: capitalCaseTransform })}
      />
      <Query.Template
        {...rest}
        isV5={isV5}
        params={params.toString()}
        clientGenerics={clientGenerics.toString()}
        hookGenerics={hookGenerics.join(', ')}
        factory={factory}
        withData={withData}
        withHeaders={withHeaders}
        withPathParams={withPathParams}
        withQueryParams={withQueryParams}
        hookName={hookName}
        returnType={`${resultType}<${resultGenerics.join(', ')}`}
        queryOptions={`${camelCase(`${factory.name}QueryOptions`)}<${queryOptionsGenerics.join(', ')}>(${queryParams.toString()})`}
        queryKey={`${queryKey}(${withPathParams ? `${pathParams}, ` : ''}${withQueryParams ? ('refParams') : ''})`}
      />
    </>
  )
}

type QueryImportFrameworkProps = {
  isV5?: boolean
}

Query.ImportReact = function(_props: QueryImportFrameworkProps): ReactNode {
  const path = '@tanstack/react-query'

  return (
    <>
      <File.Import name={['UseQueryOptions', 'UseQueryResult']} path={path} isTypeOnly />
      <File.Import name={['useQuery']} path={path} />
    </>
  )
}

Query.ImportSolid = function(_props: QueryImportFrameworkProps): ReactNode {
  const path = '@tanstack/solid-query'

  return (
    <>
      <File.Import name={['CreateQueryOptions', 'CreateQueryResult']} path={path} isTypeOnly />
      <File.Import name={['createQuery']} path={path} />
    </>
  )
}

Query.ImportSvelte = function(_props: QueryImportFrameworkProps): ReactNode {
  const path = '@tanstack/svelte-query'

  return (
    <>
      <File.Import name={['CreateQueryOptions', 'CreateQueryResult']} path={path} isTypeOnly />
      <File.Import name={['createQuery']} path={path} />
    </>
  )
}

Query.ImportVue = function({ isV5 }: QueryImportFrameworkProps): ReactNode {
  const path = '@tanstack/vue-query'

  return (
    <>
      {isV5 && <File.Import name={['UseQueryOptions', 'UseQueryReturnType']} path={path} isTypeOnly />}

      {!isV5 && <File.Import name={['UseQueryReturnType']} path={path} isTypeOnly />}
      {!isV5 && <File.Import name={['VueQueryObserverOptions']} path={'@tanstack/vue-query/build/lib/types'} isTypeOnly />}
      <File.Import name={['useQuery']} path={path} />
      <File.Import name={['unref']} path={'vue'} />
      <File.Import name={['MaybeRef']} path={'vue'} isTypeOnly />
    </>
  )
}

const defaultTemplates = { react: Query.TemplateReact, solid: Query.TemplateSolid, svelte: Query.TemplateSvelte, vue: Query.TemplateVue } as const
const defaultImports = { react: Query.ImportReact, solid: Query.ImportSolid, svelte: Query.ImportSvelte, vue: Query.ImportVue } as const

type QueryFileProps = {
  framework: Framework
  /**
   * Will make it possible to override the default behaviour of Mock.Template
   */
  templates?: typeof defaultTemplates
  imports?: typeof defaultImports
}

Query.File = function({ framework, templates = defaultTemplates, imports = defaultImports }: QueryFileProps): ReactNode {
  const { key: pluginKey, options } = usePlugin<PluginOptions>()
  const pluginManager = usePluginManager()
  const schemas = useSchemas()
  const operation = useOperation()
  const file = useResolve({ pluginKey, type: 'file' })
  const fileType = useResolveType({ type: 'file' })

  const { clientImportPath, client, templatesPath } = options
  const root = path.resolve(pluginManager.config.root, pluginManager.config.output.path)
  const clientPath = client ? path.resolve(root, 'client.ts') : undefined
  const resolvedClientPath = clientImportPath ? clientImportPath : clientPath ? getRelativePath(file.path, clientPath) : '@kubb/swagger-client/client'

  const Template = templates[framework]
  const Import = imports[framework]
  const isV5 = new PackageManager().isValidSync(/@tanstack/, '>=5')

  return (
    <>
      <File override baseName={'types.ts'} path={path.resolve(file.path, '../types.ts')}>
        <File.Import name={'client'} path={resolvedClientPath} />
        <File.Source path={path.resolve(templatesPath, './types.ts')} print removeComments />
      </File>
      <File<FileMeta>
        baseName={file.baseName}
        path={file.path}
        meta={{
          pluginKey,
          // needed for the `output.groupBy`
          tag: operation?.getTags()[0]?.name,
        }}
      >
        {/** for HelpersFile, TODO add to operationGenerator */}
        <File.Import root={file.path} path={path.resolve(file.path, '../types.ts')} name={['KubbQueryFactory']} isTypeOnly />

        <File.Import name={'client'} path={resolvedClientPath} />
        <File.Import name={['ResponseConfig']} path={resolvedClientPath} isTypeOnly />
        <File.Import
          name={[
            schemas.response.name,
            schemas.pathParams?.name,
            schemas.queryParams?.name,
            schemas.headerParams?.name,
            ...schemas.errors?.map((error) => error.name) || [],
          ].filter(
            Boolean,
          )}
          root={file.path}
          path={fileType.path}
          isTypeOnly
        />
        <File.Import name={['QueryKey']} path={'@tanstack/query-core'} isTypeOnly />
        <Import isV5={isV5} />
        <File.Source>
          <Query Template={Template} />
        </File.Source>
      </File>
    </>
  )
}

type QueryProps = {
  Template?: React.ComponentType<QueryTemplateFrameworkProps>
}

export function Query({
  Template = defaultTemplates.react,
}: QueryProps): ReactNode {
  const { key: pluginKey } = usePlugin<PluginOptions>()
  const operation = useOperation()
  const { name } = useResolve({
    pluginKey,
    type: 'function',
  })
  const schemas = useSchemas()

  const factory: QueryTemplateProps['factory'] = {
    name: pascalCase(operation.getOperationId()),
    Generics: [
      schemas.response.name,
      schemas.errors?.map((error) => error.name).join(' | ') || 'never',
      schemas.request?.name || 'never',
      schemas.pathParams?.name || 'never',
      schemas.queryParams?.name || 'never',
      schemas.headerParams?.name || 'never',
      schemas.response.name,
      `{ dataReturnType: 'full'; type: 'query' }`,
    ],
  }
  const generics = new FunctionParams()
  const isV5 = new PackageManager().isValidSync(/@tanstack/, '>=5')

  generics.add([
    { type: `TQueryFnData extends ${factory.name}['data']`, default: `${factory.name}["data"]` },
    { type: 'TError', default: `${factory.name}["error"]` },
    { type: 'TData', default: `${factory.name}["response"]` },
    { type: 'TQueryData', default: `${factory.name}["response"]` },
    { type: `TQueryKey extends QueryKey`, default: capitalCase(`${factory.name}QueryKey`, { delimiter: '', transform: capitalCaseTransform }) },
  ])

  return (
    <Template
      isV5={isV5}
      name={name}
      schemas={schemas}
      generics={generics.toString()}
      path={new URLPath(operation.path)}
      withQueryParams={!!schemas.queryParams?.name}
      withPathParams={!!schemas.pathParams?.name}
      withData={!!schemas.request?.name}
      withHeaders={!!schemas.headerParams?.name}
      factory={factory}
      comments={getComments(operation)}
      method={operation.method}
    />
  )
}
