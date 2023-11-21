import { FunctionParams, URLPath } from '@kubb/core/utils'
import { File, Function, usePlugin } from '@kubb/react'
import { useOperation, useOperationFile, useOperationName, useResolveName, useSchemas } from '@kubb/swagger/hooks'
import { getASTParams, getComments } from '@kubb/swagger/utils'
import { pluginKey as swaggerTsPluginKey } from '@kubb/swagger-ts'

import { QueryOptions } from './QueryOptions.tsx'

import type { ReactNode } from 'react'
import type { FileMeta, PluginOptions } from '../types.ts'

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
  }
}

function Template({
  name,
  generics,
  returnType,
  params,
  JSDoc,
  hook,
  client,
}: TemplateProps): ReactNode {
  return (
    <>
      <Function name={name} export generics={generics} returnType={returnType} params={params} JSDoc={JSDoc}>
        {`
       const { query: queryOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}

       const url = shouldFetch ? ${client.path.template} : null

       const query = ${hook.name}<${hook.generics}>(
        url,
        {
          ...${hook.queryOptions},
          ...queryOptions
        }
       )

       return query
       `}
      </Function>
    </>
  )
}

const defaultTemplates = {
  default: Template,
} as const

type Props = {
  /**
   * This will make it possible to override the default behaviour.
   */
  Template?: React.ComponentType<TemplateProps>
  /**
   * This will make it possible to override the default behaviour.
   */
  QueryOptionsTemplate?: React.ComponentType<React.ComponentProps<typeof QueryOptions.templates.default>>
}

export function Query({
  Template = defaultTemplates.default,
  QueryOptionsTemplate = QueryOptions.templates.default,
}: Props): ReactNode {
  const { key: pluginKey, options: { dataReturnType } } = usePlugin<PluginOptions>()
  const operation = useOperation()
  const schemas = useSchemas()
  const name = useOperationName({ type: 'function' })
  const factoryName = useOperationName({ type: 'type' })

  const factory = {
    name: factoryName,
  }
  const queryOptionsName = useResolveName({ name: `${factory.name}QueryOptions`, pluginKey })
  const generics = new FunctionParams()
  const params = new FunctionParams()
  const queryParams = new FunctionParams()
  const client = {
    method: operation.method,
    path: new URLPath(operation.path),
    generics: ['TData', 'TError'].join(', '),
    withQueryParams: !!schemas.queryParams?.name,
    withData: !!schemas.request?.name,
    withPathParams: !!schemas.pathParams?.name,
    withHeaders: !!schemas.headerParams?.name,
  }

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
      required: false,
      type: `{
        query?: SWRConfiguration<${resultGenerics.join(', ')}>,
        client?: Partial<Parameters<typeof client<${client.generics}>>[0]>,
        shouldFetch?: boolean,
      }`,
      default: '{}',
    },
  ])

  queryParams.add([
    ...getASTParams(schemas.pathParams, { typed: false }),
    {
      name: 'params',
      enabled: !!schemas.queryParams?.name,
      required: false,
    },
    {
      name: 'headers',
      enabled: !!schemas.headerParams?.name,
      required: false,
    },
    {
      name: 'clientOptions',
      required: false,
    },
  ])

  const hook = {
    name: 'useSWR',
    generics: [...resultGenerics, 'string | null'].join(', '),
    queryOptions: `${queryOptionsName}<${client.generics}>(${queryParams.toString()})`,
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

Query.File = function({ templates }: FileProps): ReactNode {
  const { options: { clientImportPath } } = usePlugin<PluginOptions>()
  const schemas = useSchemas()
  const file = useOperationFile()
  const fileType = useOperationFile({ pluginKey: swaggerTsPluginKey })

  const Template = templates?.query.default || defaultTemplates.default
  const QueryOptionsTemplate = templates?.queryOptions.default || QueryOptions.templates.default

  return (
    <>
      <File<FileMeta>
        baseName={file.baseName}
        path={file.path}
        meta={file.meta}
      >
        <File.Import name="useSWR" path="swr" />
        <File.Import name={['SWRConfiguration', 'SWRResponse']} path="swr" isTypeOnly />
        <File.Import name={'client'} path={clientImportPath} />
        <File.Import name={['ResponseConfig']} path={clientImportPath} isTypeOnly />
        <File.Import
          name={[
            schemas.request?.name,
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

        <File.Source>
          <Query
            Template={Template}
            QueryOptionsTemplate={QueryOptionsTemplate}
          />
        </File.Source>
      </File>
    </>
  )
}

Query.templates = defaultTemplates
