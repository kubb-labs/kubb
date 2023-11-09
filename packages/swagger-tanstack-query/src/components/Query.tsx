import path from 'node:path'

import { PackageManager } from '@kubb/core'
import { FunctionParams, getRelativePath, URLPath } from '@kubb/core/utils'
import { File, Function, Type, usePlugin, usePluginManager } from '@kubb/react'
import { useOperation, useResolve, useSchemas } from '@kubb/swagger/hooks'
import { getASTParams, getComments, getParams } from '@kubb/swagger/utils'
import { useResolve as useResolveType } from '@kubb/swagger-ts/hooks'

import { camelCase, capitalCase, capitalCaseTransform, pascalCase } from 'change-case'

import { QueryImports } from './QueryImports.tsx'
import { QueryKey } from './QueryKey.tsx'
import { QueryOptions } from './QueryOptions.tsx'

import type { HttpMethod, OperationSchemas } from '@kubb/swagger'
import type { ReactNode } from 'react'
import type { FileMeta, Framework, PluginOptions } from '../types.ts'

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
    name: string
    generics?: string
    queryKey: string
    queryOptions: string
  }
  isV5: boolean
}

function Template({
  name,
  generics,
  returnType,
  params,
  JSDoc,
  hook,
}: TemplateProps): ReactNode {
  const resolvedReturnType = `${returnType} & { queryKey: TQueryKey }`

  return (
    <>
      <Function name={name} export generics={generics} returnType={resolvedReturnType} params={params} JSDoc={JSDoc}>
        {`
       const { query: queryOptions, client: clientOptions = {} } = options ?? {}
       const queryKey = queryOptions?.queryKey ?? ${hook.queryKey}

       const query = ${hook.name}<${hook.generics}>({
        ...${hook.queryOptions},
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

type FrameworkTemplateProps =
  & Omit<TemplateProps, 'returnType' | 'hook' | 'params'>
  & {
    optionsType?: string
    resultType?: string
    hook?: Pick<TemplateProps['hook'], 'name'>
    client: {
      method: HttpMethod
      withQueryParams: boolean
      withPathParams: boolean
      withData: boolean
      withHeaders: boolean
      path: URLPath
    }
    schemas: OperationSchemas
    factory: {
      name: string
      generics: [data: string, error: string, request: string, pathParams: string, queryParams: string, headerParams: string, response: string, options: string]
    }
    /**
     * This will make it possible to override the default behaviour.
     */
    Template?: React.ComponentType<React.ComponentProps<typeof Template>>
    /**
     * This will make it possible to override the default behaviour.
     */
    QueryKeyTemplate?: React.ComponentType<React.ComponentProps<typeof QueryKey.templates.default>>
    /**
     * This will make it possible to override the default behaviour.
     */
    QueryOptionsTemplate?: React.ComponentType<React.ComponentProps<typeof QueryOptions.templates.default>>
  }

const defaultTemplates = {
  get default() {
    return function(
      {
        resultType,
        optionsType,
        isV5,
        schemas,
        client,
        hook,
        factory,
        Template: QueryTemplate = Template,
        QueryKeyTemplate = QueryKey.templates.default,
        QueryOptionsTemplate = QueryOptions.templates.default,
        ...rest
      }: FrameworkTemplateProps,
    ): ReactNode {
      if (!hook?.name || !resultType || !optionsType) {
        throw new Error('Could not find a hookname')
      }

      const queryKey = camelCase(`${factory.name}QueryKey`)

      const params = new FunctionParams()
      const queryParams = new FunctionParams()

      const pathParams = getParams(schemas.pathParams, {}).toString()

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
          enabled: client.withQueryParams,
          required: !!schemas.queryParams?.schema.required?.length,
        },
        {
          name: 'headers',
          type: `${factory.name}['headerParams']`,
          enabled: client.withHeaders,
          required: !!schemas.headerParams?.schema.required?.length,
        },
        {
          name: 'options',
          type: `{
        query?: ${optionsType}<${queryOptionsOverrideGenerics.join(', ')}>,
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
          enabled: client.withQueryParams,
          required: !!schemas.queryParams?.schema.required?.length,
        },
        {
          name: 'headers',
          enabled: client.withHeaders,
          required: !!schemas.headerParams?.schema.required?.length,
        },
        {
          name: 'clientOptions',
          required: false,
        },
      ])

      return (
        <>
          <Type name={factory.name}>
            {`KubbQueryFactory<${factory.generics.join(', ')}>`}
          </Type>
          <QueryKeyTemplate
            factory={factory}
            name={queryKey}
          />
          <QueryOptionsTemplate factory={factory} isV5={isV5} resultType={optionsType} />
          <QueryTemplate
            {...rest}
            isV5={isV5}
            params={params.toString()}
            returnType={`${resultType}<${resultGenerics.join(', ')}>`}
            hook={{
              ...hook,
              generics: hookGenerics.join(', '),
              queryOptions: `${camelCase(`${factory.name}QueryOptions`)}<${queryOptionsGenerics.join(', ')}>(${queryParams.toString()})`,
              queryKey: `${queryKey}(${client.withPathParams ? `${pathParams}, ` : ''}${client.withQueryParams ? ('params') : ''})`,
            }}
          />
        </>
      )
    }
  },
  get react() {
    const Component = this.default

    return function(props: FrameworkTemplateProps): ReactNode {
      return (
        <Component
          {...props}
          QueryKeyTemplate={QueryKey.templates.react}
          QueryOptionsTemplate={QueryOptions.templates.react}
          hook={{
            name: 'useQuery',
          }}
          resultType="UseQueryResult"
          optionsType={props.isV5 ? 'QueryObserverOptions' : 'UseBaseQueryOptions'}
        />
      )
    }
  },
  get solid() {
    const Component = this.default

    return function(props: FrameworkTemplateProps): ReactNode {
      return (
        <Component
          {...props}
          QueryKeyTemplate={QueryKey.templates.solid}
          QueryOptionsTemplate={QueryOptions.templates.solid}
          hook={{
            name: 'createQuery',
          }}
          resultType="CreateQueryResult"
          optionsType="CreateBaseQueryOptions"
        />
      )
    }
  },
  get svelte() {
    const Component = this.default

    return function(props: FrameworkTemplateProps): ReactNode {
      return (
        <Component
          {...props}
          QueryKeyTemplate={QueryKey.templates.svelte}
          QueryOptionsTemplate={QueryOptions.templates.svelte}
          hook={{
            name: 'createQuery',
          }}
          resultType="CreateQueryResult"
          optionsType="CreateBaseQueryOptions"
        />
      )
    }
  },
  get vue() {
    return function(
      { isV5, schemas, client, hook, factory, Template: QueryTemplate = Template, ...rest }: FrameworkTemplateProps,
    ): ReactNode {
      const hookName = 'useQuery'
      const resultType = 'UseQueryReturnType'
      const optionsType = isV5 ? 'QueryObserverOptions' : 'VueQueryObserverOptions'
      const queryKey = camelCase(`${factory.name}QueryKey`)

      const params = new FunctionParams()
      const queryParams = new FunctionParams()

      const pathParams = getParams(schemas.pathParams, { override: (item) => ({ ...item, name: item.name ? `ref${pascalCase(item.name)}` : undefined }) })
        .toString()

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
          type: `{
              query?: ${optionsType}<${queryOptionsOverrideGenerics.join(', ')}>,
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
          enabled: client.withQueryParams,
          required: !!schemas.queryParams?.schema.required?.length,
        },
        {
          name: 'refHeaders',
          enabled: client.withHeaders,
          required: !!schemas.headerParams?.schema.required?.length,
        },
        {
          name: 'clientOptions',
          required: false,
        },
      ])

      return (
        <>
          <Type name={factory.name}>
            {`KubbQueryFactory<${factory.generics.join(', ')}>`}
          </Type>
          <QueryKey.templates.vue
            factory={factory}
            name={queryKey}
          />
          <QueryOptions.templates.vue factory={factory} isV5={isV5} />
          <QueryTemplate
            {...rest}
            isV5={isV5}
            params={params.toString()}
            returnType={`${resultType}<${resultGenerics.join(', ')}>`}
            hook={{
              ...hook,
              name: hookName,
              generics: hookGenerics.join(', '),
              queryOptions: `${camelCase(`${factory.name}QueryOptions`)}<${queryOptionsGenerics.join(', ')}>(${queryParams.toString()})`,
              queryKey: `${queryKey}(${client.withPathParams ? `${pathParams}, ` : ''}${client.withQueryParams ? ('refParams') : ''})`,
            }}
          />
        </>
      )
    }
  },
} as const

type Props = {
  /**
   * This will make it possible to override the default behaviour.
   */
  Template?: React.ComponentType<FrameworkTemplateProps>
}

export function Query({
  Template = defaultTemplates.react,
}: Props): ReactNode {
  const { key: pluginKey, options } = usePlugin<PluginOptions>()
  const operation = useOperation()
  const { name } = useResolve({
    pluginKey,
    type: 'function',
  })
  const schemas = useSchemas()

  const factory: FrameworkTemplateProps['factory'] = {
    name: pascalCase(operation.getOperationId()),
    generics: [
      schemas.response.name,
      schemas.errors?.map((error) => error.name).join(' | ') || 'never',
      schemas.request?.name || 'never',
      schemas.pathParams?.name || 'never',
      schemas.queryParams?.name || 'never',
      schemas.headerParams?.name || 'never',
      schemas.response.name,
      `{ dataReturnType: '${options.dataReturnType}'; type: 'query' }`,
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
      factory={factory}
      JSDoc={{ comments: getComments(operation) }}
      client={{
        withQueryParams: !!schemas.queryParams?.name,
        withData: !!schemas.request?.name,
        withPathParams: !!schemas.pathParams?.name,
        withHeaders: !!schemas.headerParams?.name,
        method: operation.method,
        path: new URLPath(operation.path),
      }}
    />
  )
}

type FileProps = {
  framework: Framework
  /**
   * This will make it possible to override the default behaviour.
   */
  templates?: typeof defaultTemplates
  imports?: typeof QueryImports.templates
}

Query.File = function({ framework, templates = defaultTemplates, imports = QueryImports.templates }: FileProps): ReactNode {
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

        <Import isV5={isV5} />
        <File.Source>
          <Query Template={Template} />
        </File.Source>
      </File>
    </>
  )
}

Query.templates = defaultTemplates
