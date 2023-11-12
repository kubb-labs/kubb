import { FunctionParams, URLPath } from '@kubb/core/utils'
import { File, Function, usePlugin } from '@kubb/react'
import { useOperation, useResolve, useSchemas } from '@kubb/swagger/hooks'
import { getASTParams, getComments } from '@kubb/swagger/utils'
import { useResolve as useResolveType } from '@kubb/swagger-ts/hooks'

import { camelCase } from 'change-case'

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
  const { key: pluginKey, options } = usePlugin<PluginOptions>()
  const operation = useOperation()
  const { name } = useResolve({
    pluginKey,
    type: 'function',
  })

  const { dataReturnType = 'data' } = options
  const schemas = useSchemas()

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
    queryOptions: `${camelCase(`${operation.getOperationId()}QueryOptions`)}<${client.generics}>(${queryParams.toString()})`,
  }

  return (
    <>
      <QueryOptions Template={QueryOptionsTemplate} dataReturnType={dataReturnType} />
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
  templates?: typeof defaultTemplates
}

Query.File = function({ templates = defaultTemplates }: FileProps): ReactNode {
  const { key: pluginKey, options } = usePlugin<PluginOptions>()
  const schemas = useSchemas()
  const operation = useOperation()
  const file = useResolve({ pluginKey, type: 'file' })
  const fileType = useResolveType({ type: 'file' })

  const { clientImportPath } = options
  const resolvedClientPath = clientImportPath ? clientImportPath : '@kubb/swagger-client/client'

  const Template = templates.default

  return (
    <>
      <File<FileMeta>
        baseName={file.baseName}
        path={file.path}
        meta={{
          pluginKey,
          // needed for the `output.group`
          tag: operation?.getTags()[0]?.name,
        }}
      >
        <File.Import name="useSWR" path="swr" />
        <File.Import name={['SWRConfiguration', 'SWRResponse']} path="swr" isTypeOnly />
        <File.Import name={'client'} path={resolvedClientPath} />
        <File.Import name={['ResponseConfig']} path={resolvedClientPath} isTypeOnly />
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
          />
        </File.Source>
      </File>
    </>
  )
}

Query.templates = defaultTemplates
