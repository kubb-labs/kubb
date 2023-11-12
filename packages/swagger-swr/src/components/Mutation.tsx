import { FunctionParams, transformers, URLPath } from '@kubb/core/utils'
import { File, Function, usePlugin } from '@kubb/react'
import { useOperation, useResolve, useSchemas } from '@kubb/swagger/hooks'
import { getASTParams, getComments } from '@kubb/swagger/utils'
import { useResolve as useResolveType } from '@kubb/swagger-ts/hooks'

import type { HttpMethod } from '@kubb/swagger'
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
  }
  client: {
    method: HttpMethod
    generics: string
    withQueryParams: boolean
    withPathParams: boolean
    withData: boolean
    withHeaders: boolean
    path: URLPath
  }
}

function Template({
  name,
  generics,
  returnType,
  params,
  JSDoc,
  client,
  hook,
}: TemplateProps): ReactNode {
  const clientOptions = [
    `method: "${client.method}"`,
    `url`,
    client.withQueryParams ? 'params' : undefined,
    client.withData ? 'data' : undefined,
    client.withHeaders ? 'headers: { ...headers, ...clientOptions.headers }' : undefined,
    '...clientOptions',
  ].filter(Boolean)

  const resolvedClientOptions = `${transformers.createIndent(4)}${clientOptions.join(`,\n${transformers.createIndent(4)}`)}`

  return (
    <Function export name={name} generics={generics} returnType={returnType} params={params} JSDoc={JSDoc}>
      {`
       const { mutation: mutationOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}

       const url = shouldFetch ? ${client.path.template} : null

       return ${hook.name}<${hook.generics}>(
        url,
        (url${client.withData ? ', { arg: data }' : ''}) => {
          return client<${client.generics}>({
            ${resolvedClientOptions}
          })
        },
        mutationOptions
      )
    }`}
    </Function>
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
}

export function Mutation({
  Template = defaultTemplates.default,
}: Props): ReactNode {
  const { key: pluginKey } = usePlugin<PluginOptions>()
  const operation = useOperation()
  const { name } = useResolve({
    pluginKey,
    type: 'function',
  })
  const schemas = useSchemas()

  const generics = new FunctionParams()
  const params = new FunctionParams()
  const client = {
    method: operation.method,
    path: new URLPath(operation.path),
    generics: ['TData', 'TError', schemas.request?.name ? `TVariables` : undefined].filter(Boolean).join(', '),
    withQueryParams: !!schemas.queryParams?.name,
    withData: !!schemas.request?.name,
    withPathParams: !!schemas.pathParams?.name,
    withHeaders: !!schemas.headerParams?.name,
  }

  const resultGenerics = ['ResponseConfig<TData>', 'TError', 'string | null', schemas.request?.name ? `TVariables` : 'never'].filter(Boolean)

  generics.add([
    { type: 'TData', default: schemas.response.name },
    { type: 'TError', default: schemas.errors?.map((error) => error.name).join(' | ') || 'unknown' },
    { type: 'TVariables', default: schemas.request?.name, enabled: !!schemas.request?.name },
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
        mutation?: SWRMutationConfiguration<${resultGenerics.join(', ')}>,
        client?: Partial<Parameters<typeof client<${client.generics}>>[0]>,
        shouldFetch?: boolean,
      }`,
      default: '{}',
    },
  ])

  const hook = {
    name: 'useSWRMutation',
    generics: resultGenerics.join(', '),
  }

  return (
    <Template
      name={name}
      generics={generics.toString()}
      JSDoc={{ comments: getComments(operation) }}
      client={client}
      hook={hook}
      params={params.toString()}
      returnType={`SWRMutationResponse<${resultGenerics.join(', ')}>`}
    />
  )
}

type FileProps = {
  /**
   * This will make it possible to override the default behaviour.
   */
  templates?: typeof defaultTemplates
}

Mutation.File = function({ templates = defaultTemplates }: FileProps): ReactNode {
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
        <File.Import name="useSWRMutation" path="swr/mutation" />
        <File.Import name={['SWRMutationConfiguration', 'SWRMutationResponse']} path="swr/mutation" isTypeOnly />
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
          <Mutation
            Template={Template}
          />
        </File.Source>
      </File>
    </>
  )
}

Mutation.templates = defaultTemplates
