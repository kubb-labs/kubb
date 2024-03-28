import { PackageManager } from '@kubb/core'
import transformers from '@kubb/core/transformers'
import { FunctionParams, URLPath } from '@kubb/core/utils'
import { Editor, File, Function, usePlugin, useResolveName } from '@kubb/react'
import { pluginKey as swaggerTsPluginKey } from '@kubb/swagger-ts'
import { pluginKey as swaggerZodPluginKey } from '@kubb/swagger-zod'
import { useGetOperationFile, useOperation, useOperationName, useOperationSchemas } from '@kubb/swagger/hooks'
import { getASTParams, getComments, getParams, isRequired } from '@kubb/swagger/utils'

import { getImportNames } from '../utils.ts'
import { QueryImports } from './QueryImports.tsx'
import { QueryKey } from './QueryKey.tsx'
import { QueryOptions } from './QueryOptions.tsx'
import { SchemaType } from './SchemaType.tsx'

import type { ReactNode } from 'react'
import type { QueryOptions as QueryOptionsPluginOptions, Query as QueryPluginOptions } from '../types.ts'
import type { FileMeta, Infinite, PluginOptions, Suspense } from '../types.ts'

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
  infinite: Infinite | false
}

function Template({ name, generics, returnType, params, JSDoc, hook, infinite }: TemplateProps): ReactNode {
  const isV5 = new PackageManager().isValidSync(/@tanstack/, '>=5')
  const resolvedReturnType = `${returnType} & { queryKey: TQueryKey }`

  if (isV5) {
    return (
      <>
        <Function name={name} export generics={generics} returnType={resolvedReturnType} params={params} JSDoc={JSDoc}>
          {`
         const { query: queryOptions, client: clientOptions = {} } = options ?? {}
         const queryKey = queryOptions?.queryKey ?? ${hook.queryKey}

         const query = ${hook.name}({
          ...${hook.queryOptions} as ${infinite ? 'InfiniteQueryObserverOptions' : 'QueryObserverOptions'},
          queryKey,
          ...queryOptions as unknown as ${infinite ? 'Omit<InfiniteQueryObserverOptions, "queryKey">' : 'Omit<QueryObserverOptions, "queryKey">'}
        }) as ${resolvedReturnType}

        query.queryKey = queryKey as TQueryKey

        return query

         `}
        </Function>
      </>
    )
  }

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
    return function ({ context, hook, ...rest }: FrameworkProps): ReactNode {
      const { factory, queryKey } = context
      const importNames = getImportNames()
      const {
        key: pluginKey,
        options: { pathParamsType },
      } = usePlugin<PluginOptions>()
      const queryOptions = useResolveName({
        name: `${factory.name}QueryOptions`,
        pluginKey,
      })

      const hookName = rest.infinite ? importNames.queryInfinite.vue.hookName : importNames.query.vue.hookName
      const resultType = rest.infinite ? importNames.queryInfinite.vue.resultType : importNames.query.vue.resultType
      const optionsType = rest.infinite ? importNames.queryInfinite.vue.optionsType : importNames.query.vue.optionsType

      const schemas = useOperationSchemas()
      const isV5 = new PackageManager().isValidSync(/@tanstack/, '>=5')
      const params = new FunctionParams()
      const queryParams = new FunctionParams()
      const client = {
        withQueryParams: !!schemas.queryParams?.name,
        withData: !!schemas.request?.name,
        withPathParams: !!schemas.pathParams?.name,
        withHeaders: !!schemas.headerParams?.name,
      }

      const pathParams = getParams(schemas.pathParams, {
        override: (item) => ({
          ...item,
          name: item.name ? `ref${transformers.pascalCase(item.name)}` : undefined,
        }),
      }).toString()

      const resultGenerics = ['TData', `${factory.name}['error']`]

      // only needed for the options to override the useQuery options/params
      const queryOptionsOverrideGenerics = [`${factory.name}['response']`, `${factory.name}['error']`, 'TData', 'TQueryKey']
      const queryOptionsGenerics = ['TData', 'TQueryData']

      params.add([
        ...getASTParams(schemas.pathParams, {
          typed: true,
          asObject: pathParamsType === 'object',
          override: (item) => ({
            ...item,
            name: item.name ? `ref${transformers.pascalCase(item.name)}` : undefined,
          }),
        }),
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
          type: `{
              query?: Partial<${optionsType}<${queryOptionsOverrideGenerics.join(', ')}>>,
              client?: ${factory.name}['client']['parameters']
          }`,
          default: '{}',
        },
      ])

      queryParams.add([
        ...getASTParams(schemas.pathParams, {
          typed: false,
          override: (item) => ({
            ...item,
            name: item.name ? `ref${transformers.pascalCase(item.name)}` : undefined,
          }),
        }),
        {
          name: 'refParams',
          enabled: client.withQueryParams,
          required: isRequired(schemas.queryParams?.schema),
        },
        {
          name: 'refHeaders',
          enabled: client.withHeaders,
          required: isRequired(schemas.headerParams?.schema),
        },
        {
          name: 'clientOptions',
          required: false,
        },
      ])

      return (
        <Template
          {...rest}
          params={params.toString()}
          returnType={`${resultType}<${resultGenerics.join(', ')}>`}
          hook={{
            ...hook,
            name: hookName,
            queryOptions: isV5
              ? `${queryOptions}(${queryParams.toString()})`
              : `${queryOptions}<${queryOptionsGenerics.join(', ')}>(${queryParams.toString()})`,
            queryKey: `${queryKey}(${client.withPathParams ? `${pathParams}, ` : ''}${client.withQueryParams ? 'refParams' : ''})`,
          }}
        />
      )
    }
  },
} as const

type Props = {
  factory: {
    name: string
  }
  resultType: string
  hookName: string
  optionsType: string
  infinite: Infinite | false
  query: QueryPluginOptions | false
  queryOptions: QueryOptionsPluginOptions | false
  suspense: Suspense | false
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
  factory,
  optionsType,
  hookName,
  resultType,
  Template = defaultTemplates.react,
  QueryKeyTemplate = QueryKey.templates.react,
  QueryOptionsTemplate = QueryOptions.templates.react,
  ...props
}: Props): ReactNode {
  const {
    key: pluginKey,
    options: { dataReturnType, pathParamsType },
  } = usePlugin<PluginOptions>()
  const operation = useOperation()
  const schemas = useOperationSchemas()
  const name = useOperationName({ type: 'function' })
  const isV5 = new PackageManager().isValidSync(/@tanstack/, '>=5')

  const queryKey = useResolveName({
    name: [factory.name, props.infinite ? 'Infinite' : undefined, props.suspense ? 'Suspense' : undefined, 'QueryKey'].filter(Boolean).join(''),
    pluginKey,
  })
  const queryKeyType = useResolveName({
    name: [factory.name, props.infinite ? 'Infinite' : undefined, props.suspense ? 'Suspense' : undefined, 'QueryKey'].filter(Boolean).join(''),
    type: 'type',
    pluginKey,
  })
  const queryOptions = useResolveName({
    name: [factory.name, props.infinite ? 'Infinite' : undefined, props.suspense ? 'Suspense' : undefined, 'QueryOptions'].filter(Boolean).join(''),
    pluginKey,
  })

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

  generics.add([
    {
      type: 'TData',
      default: props.infinite ? `InfiniteData<${factory.name}["response"]>` : `${factory.name}["response"]`,
    },
    props.suspense ? undefined : { type: 'TQueryData', default: `${factory.name}["response"]` },
    { type: 'TQueryKey extends QueryKey', default: queryKeyType },
  ])

  const pathParams = getParams(schemas.pathParams, {}).toString()
  const resultGenerics = ['TData', `${factory.name}['error']`]
  // only needed for the options to override the useQuery options/params
  // suspense is having 4 generics instead of 5, TQueryData is not needed because data will always be defined
  const queryOptionsOverrideGenerics = props.suspense
    ? [`${factory.name}['response']`, `${factory.name}['error']`, 'TData', 'TQueryKey']
    : [`${factory.name}['response']`, `${factory.name}['error']`, 'TData', 'TQueryData', 'TQueryKey']

  const queryOptionsGenerics = props.suspense ? ['TData'] : ['TData', 'TQueryData']

  params.add([
    ...getASTParams(schemas.pathParams, {
      typed: true,
      asObject: pathParamsType === 'object',
    }),
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
      type: `{
    query?: Partial<${optionsType}<${queryOptionsOverrideGenerics.join(', ')}>>,
    client?: ${factory.name}['client']['parameters']
}`,
      default: '{}',
    },
  ])

  queryParams.add([
    ...getASTParams(schemas.pathParams, {
      typed: false,
      asObject: pathParamsType === 'object',
    }),
    {
      name: 'params',
      enabled: client.withQueryParams,
      required: isRequired(schemas.queryParams?.schema),
    },
    {
      name: 'headers',
      enabled: client.withHeaders,
      required: isRequired(schemas.headerParams?.schema),
    },
    {
      name: 'data',
      enabled: client.withData,
      required: isRequired(schemas.request?.schema),
    },
    {
      name: 'clientOptions',
      required: false,
    },
  ])

  const hook = {
    name: hookName,
    generics: [isV5 ? 'any' : `${factory.name}['data']`, `${factory.name}['error']`, 'TData', 'any'].join(', '),
    queryOptions: isV5 ? `${queryOptions}(${queryParams.toString()})` : `${queryOptions}<${queryOptionsGenerics.join(', ')}>(${queryParams.toString()})`,
    queryKey: `${queryKey}(${client.withPathParams ? `${pathParams}, ` : ''}${client.withQueryParams ? 'params' : ''})`,
  }

  return (
    <>
      <QueryKey
        keysFn={props.query ? props.query.queryKey : (keys: unknown[]) => keys}
        Template={QueryKeyTemplate}
        factory={factory}
        name={queryKey}
        typeName={queryKeyType}
      />

      {props.queryOptions && (
        <QueryOptions
          Template={QueryOptionsTemplate}
          factory={factory}
          resultType={optionsType}
          dataReturnType={dataReturnType}
          infinite={props.infinite}
          suspense={props.suspense}
        />
      )}

      {props.query && (
        <Template
          name={[name, props.infinite ? 'Infinite' : undefined, props.suspense ? 'Suspense' : undefined].filter(Boolean).join('')}
          generics={generics.toString()}
          JSDoc={{ comments: getComments(operation) }}
          params={params.toString()}
          returnType={`${resultType}<${resultGenerics.join(', ')}>`}
          hook={hook}
          infinite={props.infinite}
          context={{
            factory,
            queryKey,
          }}
        />
      )}
    </>
  )
}

type FileProps = {
  /**
   * This will make it possible to override the default behaviour.
   */
  templates?: {
    query: typeof defaultTemplates
    queryKey: typeof QueryKey.templates
    queryOptions: typeof QueryOptions.templates
  }
  imports?: typeof QueryImports.templates
}

Query.File = function ({ templates, imports = QueryImports.templates }: FileProps): ReactNode {
  const {
    options: {
      client: { importPath },
      framework,
      infinite,
      suspense,
      query,
      queryOptions,
      parser,
    },
  } = usePlugin<PluginOptions>()

  const schemas = useOperationSchemas()
  const file = useGetOperationFile()
  const fileType = useGetOperationFile({ pluginKey: swaggerTsPluginKey })
  const fileZodSchemas = useGetOperationFile({
    pluginKey: swaggerZodPluginKey,
  })
  const zodResponseName = useResolveName({
    name: schemas.response.name,
    pluginKey: swaggerZodPluginKey,
    type: 'function',
  })

  const factoryName = useOperationName({ type: 'type' })

  const importNames = getImportNames()
  const isV5 = new PackageManager().isValidSync(/@tanstack/, '>=5')
  const Template = templates?.query[framework] || defaultTemplates[framework]
  const QueryOptionsTemplate = templates?.queryOptions[framework] || QueryOptions.templates[framework]
  const QueryKeyTemplate = templates?.queryKey[framework] || QueryKey.templates[framework]
  const Import = imports[framework]

  const factory = {
    name: factoryName,
  }

  return (
    <Editor language="typescript">
      <File<FileMeta> baseName={file.baseName} path={file.path} meta={file.meta}>
        {parser === 'zod' && <File.Import name={[zodResponseName]} root={file.path} path={fileZodSchemas.path} />}
        <File.Import name={'client'} path={importPath} />
        <File.Import name={['ResponseConfig']} path={importPath} isTypeOnly />
        <File.Import
          name={[
            schemas.request?.name,
            schemas.response.name,
            schemas.pathParams?.name,
            schemas.queryParams?.name,
            schemas.headerParams?.name,
            ...(schemas.errors?.map((error) => error.name) || []),
          ].filter(Boolean)}
          root={file.path}
          path={fileType.path}
          isTypeOnly
        />

        <QueryImports Template={Import} isInfinite={false} isSuspense={false} />
        {!!infinite && <QueryImports Template={Import} isInfinite={true} isSuspense={false} />}
        {!!suspense && isV5 && framework === 'react' && <QueryImports Template={Import} isInfinite={false} isSuspense={true} />}
        <File.Source>
          <SchemaType factory={factory} />
          <Query
            factory={factory}
            Template={Template}
            QueryKeyTemplate={QueryKeyTemplate}
            QueryOptionsTemplate={QueryOptionsTemplate}
            infinite={false}
            suspense={false}
            query={query}
            queryOptions={queryOptions}
            hookName={importNames.query[framework].hookName}
            resultType={importNames.query[framework].resultType}
            optionsType={importNames.query[framework].optionsType}
          />
          {!!infinite && (
            <Query
              factory={factory}
              Template={Template}
              QueryKeyTemplate={QueryKeyTemplate}
              QueryOptionsTemplate={QueryOptionsTemplate}
              infinite={infinite}
              suspense={false}
              query={query}
              queryOptions={queryOptions}
              hookName={importNames.queryInfinite[framework].hookName}
              resultType={importNames.queryInfinite[framework].resultType}
              optionsType={importNames.queryInfinite[framework].optionsType}
            />
          )}
          {!!suspense && isV5 && framework === 'react' && (
            <Query
              factory={factory}
              Template={Template}
              QueryKeyTemplate={QueryKeyTemplate}
              QueryOptionsTemplate={QueryOptionsTemplate}
              infinite={false}
              suspense={suspense}
              query={query}
              queryOptions={queryOptions}
              hookName={importNames.querySuspense[framework].hookName}
              resultType={importNames.querySuspense[framework].resultType}
              optionsType={importNames.querySuspense[framework].optionsType}
            />
          )}
        </File.Source>
      </File>
    </Editor>
  )
}

Query.templates = defaultTemplates
