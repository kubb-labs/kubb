import { FunctionParams, URLPath } from '@kubb/core/utils'
import { useOperation, useOperationManager } from '@kubb/plugin-oas/hooks'
import { getASTParams, getComments } from '@kubb/plugin-oas/utils'
import { pluginTsName } from '@kubb/plugin-ts'
import { pluginZodName } from '@kubb/plugin-zod'
import { File, Function, useApp } from '@kubb/react'

import { QueryOptions } from './QueryOptions.tsx'
import { SchemaType } from './SchemaType.tsx'

import type { ReactNode } from 'react'
import type { FileMeta, PluginSwr } from '../types.ts'

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
    queryOptions: string
  }
  client: {
    path: URLPath
    withQueryParams: boolean
  }
}

function Template({ name, generics, returnType, params, JSDoc, hook, client }: TemplateProps): ReactNode {
  if (client.withQueryParams) {
    return (
      <File.Source name={name} isExportable isIndexable>
        <Function name={name} export generics={generics} returnType={returnType} params={params} JSDoc={JSDoc}>
          {`
         const { query: queryOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}

         const url = ${client.path.template}
         const query = ${hook.name}<${hook.generics}>(
          shouldFetch ? [url, params]: null,
          {
            ...${hook.queryOptions},
            ...queryOptions
          }
         )

         return query
         `}
        </Function>
      </File.Source>
    )
  }

  return (
    <File.Source name={name} isExportable isIndexable>
      <Function name={name} export generics={generics} returnType={returnType} params={params} JSDoc={JSDoc}>
        {`
       const { query: queryOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}

       const url = ${client.path.template}
       const query = ${hook.name}<${hook.generics}>(
        shouldFetch ? url : null,
        {
          ...${hook.queryOptions},
          ...queryOptions
        }
       )

       return query
       `}
      </Function>
    </File.Source>
  )
}

const defaultTemplates = {
  default: Template,
} as const

type Props = {
  factory: {
    name: string
  }
  /**
   * This will make it possible to override the default behaviour.
   */
  Template?: React.ComponentType<TemplateProps>
  /**
   * This will make it possible to override the default behaviour.
   */
  QueryOptionsTemplate?: React.ComponentType<React.ComponentProps<typeof QueryOptions.templates.default>>
}

export function Query({ factory, Template = defaultTemplates.default, QueryOptionsTemplate = QueryOptions.templates.default }: Props): ReactNode {
  const {
    pluginManager,
    plugin: {
      key: pluginKey,
      options: { dataReturnType },
    },
  } = useApp<PluginSwr>()

  const operation = useOperation()
  const { getSchemas, getName } = useOperationManager()

  const schemas = getSchemas(operation, { pluginKey: [pluginTsName], type: 'type' })

  const name = getName(operation, { type: 'function' })

  const queryOptionsName = pluginManager.resolveName({
    name: `${factory.name}QueryOptions`,
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

  const resultGenerics = ['TData', `${factory.name}["error"]`]

  generics.add([{ type: 'TData', default: `${factory.name}["response"]` }])

  const queryOptionsGenerics = ['TData']

  params.add([
    ...getASTParams(schemas.pathParams, { typed: true }),
    {
      name: 'params',
      type: `${factory.name}['queryParams']`,
      enabled: client.withQueryParams,
      required: false,
    },
    {
      name: 'headers',
      type: `${factory.name}['headerParams']`,
      enabled: client.withHeaders,
      required: false,
    },
    {
      name: 'options',
      required: false,
      type: `{
        query?: SWRConfiguration<${resultGenerics.join(', ')}>,
        client?: ${factory.name}['client']['parameters'],
        shouldFetch?: boolean,
      }`,
      default: '{}',
    },
  ])

  queryParams.add([
    ...getASTParams(schemas.pathParams, { typed: false }),
    {
      name: 'params',
      enabled: client.withQueryParams,
      required: false,
    },
    {
      name: 'headers',
      enabled: client.withHeaders,
      required: false,
    },
    {
      name: 'clientOptions',
      required: false,
    },
  ])

  const hook = {
    name: 'useSWR',
    generics: [...resultGenerics, client.withQueryParams ? '[typeof url, typeof params] | null' : 'typeof url | null'].join(', '),
    queryOptions: `${queryOptionsName}<${queryOptionsGenerics.join(', ')}>(${queryParams.toString()})`,
  }

  return (
    <>
      <QueryOptions factory={factory} Template={QueryOptionsTemplate} dataReturnType={dataReturnType} />
      <Template
        name={name}
        generics={generics.toString()}
        JSDoc={{ comments: getComments(operation) }}
        client={client}
        hook={hook}
        params={params.toString()}
        returnType={`SWRResponse<${resultGenerics.join(', ')}>`}
      />
    </>
  )
}

type FileProps = {
  /**
   * This will make it possible to override the default behaviour.
   */
  templates?: {
    query: typeof defaultTemplates
    queryOptions: typeof QueryOptions.templates
  }
}

Query.File = function ({ templates }: FileProps): ReactNode {
  const {
    pluginManager,
    plugin: {
      options: {
        extName,
        client: { importPath },
        parser,
      },
    },
  } = useApp<PluginSwr>()
  const { getSchemas, getFile, getName } = useOperationManager()
  const operation = useOperation()

  const file = getFile(operation)
  const schemas = getSchemas(operation, { pluginKey: [pluginTsName], type: 'type' })
  const zodSchemas = getSchemas(operation, { pluginKey: [pluginZodName], type: 'function' })
  const fileType = getFile(operation, { pluginKey: [pluginTsName] })
  const fileZodSchemas = getFile(operation, {
    pluginKey: [pluginZodName],
  })

  const factoryName = getName(operation, { type: 'type' })

  const Template = templates?.query.default || defaultTemplates.default
  const QueryOptionsTemplate = templates?.queryOptions.default || QueryOptions.templates.default
  const factory = {
    name: factoryName,
  }

  return (
    <File<FileMeta> baseName={file.baseName} path={file.path} meta={file.meta}>
      {parser === 'zod' && <File.Import name={[zodSchemas.response.name]} root={file.path} path={fileZodSchemas.path} />}
      <File.Import name="useSWR" path="swr" />
      <File.Import name={['SWRConfiguration', 'SWRResponse']} path="swr" isTypeOnly />
      <File.Import name={'client'} path={importPath} />
      <File.Import
        name={[
          schemas.request?.name,
          schemas.response.name,
          schemas.pathParams?.name,
          schemas.queryParams?.name,
          schemas.headerParams?.name,
          ...(schemas.errors?.map((item) => item.name) || []),
        ].filter(Boolean)}
        root={file.path}
        path={fileType.path}
        isTypeOnly
      />

      <SchemaType factory={factory} />
      <Query factory={factory} Template={Template} QueryOptionsTemplate={QueryOptionsTemplate} />
    </File>
  )
}

Query.templates = defaultTemplates
