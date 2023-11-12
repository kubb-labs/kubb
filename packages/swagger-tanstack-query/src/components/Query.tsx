import path from 'node:path'

import { PackageManager } from '@kubb/core'
import { FunctionParams, URLPath } from '@kubb/core/utils'
import { File, Function, Type, usePlugin } from '@kubb/react'
import { useOperation, useResolve, useSchemas } from '@kubb/swagger/hooks'
import { getASTParams, getComments, getParams } from '@kubb/swagger/utils'
import { useResolve as useResolveType } from '@kubb/swagger-ts/hooks'

import { camelCase, camelCaseTransformMerge, capitalCase, capitalCaseTransform, pascalCase, pascalCaseTransformMerge } from 'change-case'

import { getImportNames } from '../utils.ts'
import { QueryImports } from './QueryImports.tsx'
import { QueryKey } from './QueryKey.tsx'
import { QueryOptions } from './QueryOptions.tsx'

import type { ReactNode } from 'react'
import type { FileMeta, Infinite, PluginOptions } from '../types.ts'

type Factory = {
  name: string
  generics: [data: string, error: string, request: string, pathParams: string, queryParams: string, headerParams: string, response: string, options: string]
}

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

type FrameworkProps = TemplateProps & {
  context: {
    factory: {
      name: string
    }
    queryKey: string
    infinite: Infinite | undefined
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
      { context, ...rest }: FrameworkProps,
    ): ReactNode {
      const { factory, queryKey, infinite } = context
      const isV5 = new PackageManager().isValidSync(/@tanstack/, '>=5')
      const importNames = getImportNames()

      const hookName = infinite ? importNames.queryInfinite.vue.hookName : importNames.query.vue.hookName
      const resultType = infinite ? importNames.queryInfinite.vue.resultType : importNames.query.vue.resultType
      const optionsType = infinite ? importNames.queryInfinite.vue.optionsType : importNames.query.vue.optionsType

      const schemas = useSchemas()
      const params = new FunctionParams()
      const queryParams = new FunctionParams()
      const client = {
        withQueryParams: !!schemas.queryParams?.name,
        withData: !!schemas.request?.name,
        withPathParams: !!schemas.pathParams?.name,
        withHeaders: !!schemas.headerParams?.name,
      }

      const pathParams = getParams(schemas.pathParams, { override: (item) => ({ ...item, name: item.name ? `ref${pascalCase(item.name)}` : undefined }) })
        .toString()

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

      const hook = {
        name: hookName,
        generics: [isV5 ? 'any' : 'TQueryFnData', 'TError', 'TData', 'any'].join(', '),
        queryOptions: `${camelCase(`${factory.name}QueryOptions`)}<${queryOptionsGenerics.join(', ')}>(${queryParams.toString()})`,
        queryKey: `${queryKey}(${client.withPathParams ? `${pathParams}, ` : ''}${client.withQueryParams ? ('refParams') : ''})`,
      }

      return (
        <Template
          {...rest}
          params={params.toString()}
          returnType={`${resultType}<${resultGenerics.join(', ')}>`}
          hook={hook}
        />
      )
    }
  },
} as const

type Props = {
  resultType: string
  hookName: string
  optionsType: string
  infinite: Infinite | undefined
  /**
   * This will make it possible to override the default behaviour.
   */
  Template?: React.ComponentType<FrameworkProps>
  /**
   * This will make it possible to override the default behaviour.
   */
  QueryKeyTemplate?: React.ComponentType<React.ComponentProps<typeof QueryKey.templates.react>>
  /**
   * This will make it possible to override the default behaviour.
   */
  QueryOptionsTemplate?: React.ComponentType<React.ComponentProps<typeof QueryOptions.templates.react>>
}

export function Query({
  infinite,
  optionsType,
  hookName,
  resultType,
  Template = defaultTemplates.react,
  QueryKeyTemplate = QueryKey.templates.react,
  QueryOptionsTemplate = QueryOptions.templates.react,
}: Props): ReactNode {
  const { key: pluginKey, options } = usePlugin<PluginOptions>()
  const operation = useOperation()
  const { name } = useResolve({
    pluginKey,
    type: 'function',
  })
  const schemas = useSchemas()
  const isV5 = new PackageManager().isValidSync(/@tanstack/, '>=5')

  const factory: Factory = {
    name: infinite
      ? pascalCase(`${operation.getOperationId()}Infinite`, { delimiter: '', transform: pascalCaseTransformMerge })
      : pascalCase(operation.getOperationId(), { delimiter: '', transform: pascalCaseTransformMerge }),
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
  const params = new FunctionParams()
  const queryParams = new FunctionParams()
  const client = {
    method: operation.method,
    path: new URLPath(operation.path),
    withQueryParams: !!schemas.queryParams?.name,
    withData: !!schemas.request?.name,
    withPathParams: !!schemas.pathParams?.name,
    withHeaders: !!schemas.headerParams?.name,
  }
  const queryKey = camelCase(`${factory.name}QueryKey`, { delimiter: '', transform: camelCaseTransformMerge })

  generics.add([
    { type: `TQueryFnData extends ${factory.name}['data']`, default: `${factory.name}["data"]` },
    { type: 'TError', default: `${factory.name}["error"]` },
    { type: 'TData', default: `${factory.name}["response"]` },
    { type: 'TQueryData', default: `${factory.name}["response"]` },
    { type: `TQueryKey extends QueryKey`, default: capitalCase(`${factory.name}QueryKey`, { delimiter: '', transform: capitalCaseTransform }) },
  ])

  const pathParams = getParams(schemas.pathParams, {}).toString()
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

  const hook = {
    name: hookName,
    generics: [isV5 ? 'any' : 'TQueryFnData', 'TError', 'TData', 'any'].join(', '),
    queryOptions: `${camelCase(`${factory.name}QueryOptions`)}<${queryOptionsGenerics.join(', ')}>(${queryParams.toString()})`,
    queryKey: `${queryKey}(${client.withPathParams ? `${pathParams}, ` : ''}${client.withQueryParams ? ('params') : ''})`,
  }

  return (
    <>
      <Type name={factory.name}>
        {`KubbQueryFactory<${factory.generics.join(', ')}>`}
      </Type>
      <QueryKey Template={QueryKeyTemplate} factory={factory} name={queryKey} />
      <QueryOptions Template={QueryOptionsTemplate} factory={factory} resultType={optionsType} infinite={infinite} />
      <Template
        name={infinite ? `${name}Infinite` : name}
        generics={generics.toString()}
        JSDoc={{ comments: getComments(operation) }}
        params={params.toString()}
        returnType={`${resultType}<${resultGenerics.join(', ')}>`}
        hook={hook}
        context={{
          factory,
          queryKey,
          infinite,
        }}
      />
    </>
  )
}

type FileProps = {
  /**
   * This will make it possible to override the default behaviour.
   */
  templates?: typeof defaultTemplates
  imports?: typeof QueryImports.templates
}

Query.File = function({ templates = defaultTemplates, imports = QueryImports.templates }: FileProps): ReactNode {
  const { key: pluginKey, options } = usePlugin<PluginOptions>()
  const schemas = useSchemas()
  const operation = useOperation()
  const file = useResolve({ pluginKey, type: 'file' })
  const fileType = useResolveType({ type: 'file' })

  const { clientImportPath, templatesPath, framework, infinite } = options
  const resolvedClientPath = clientImportPath ? clientImportPath : '@kubb/swagger-client/client'

  const importNames = getImportNames()
  const Template = templates[framework]
  const Import = imports[framework]

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
          // needed for the `output.group`
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

        <QueryImports Template={Import} isInfinite={false} />
        {!!infinite && <QueryImports Template={Import} isInfinite={true} />}
        <File.Source>
          <Query
            Template={Template}
            QueryKeyTemplate={QueryKey.templates[framework]}
            QueryOptionsTemplate={QueryOptions.templates[framework]}
            infinite={undefined}
            hookName={importNames.query[framework].hookName}
            resultType={importNames.query[framework].resultType}
            optionsType={importNames.query[framework].optionsType}
          />
          {!!infinite && (
            <Query
              Template={Template}
              QueryKeyTemplate={QueryKey.templates[framework]}
              QueryOptionsTemplate={QueryOptions.templates[framework]}
              infinite={infinite}
              hookName={importNames.queryInfinite[framework].hookName}
              resultType={importNames.queryInfinite[framework].resultType}
              optionsType={importNames.queryInfinite[framework].optionsType}
            />
          )}
        </File.Source>
      </File>
    </>
  )
}

Query.templates = defaultTemplates
