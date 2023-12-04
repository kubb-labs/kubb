import transformers from '@kubb/core/transformers'
import { FunctionParams, URLPath } from '@kubb/core/utils'
import { File, Function, usePlugin } from '@kubb/react'
import { useOperation, useOperationFile, useOperationName, useSchemas } from '@kubb/swagger/hooks'
import { getASTParams, getComments } from '@kubb/swagger/utils'
import { pluginKey as swaggerTsPluginKey } from '@kubb/swagger-ts'

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
  if (client.withQueryParams) {
    return (
      <Function export name={name} generics={generics} returnType={returnType} params={params} JSDoc={JSDoc}>
        {`
         const { mutation: mutationOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}

         const url = ${client.path.template} as const
         return ${hook.name}<${hook.generics}>(
          shouldFetch ? [url, params]: null,
          (_url${client.withData ? ', { arg: data }' : ''}) => {
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
  return (
    <Function export name={name} generics={generics} returnType={returnType} params={params} JSDoc={JSDoc}>
      {`
       const { mutation: mutationOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}

       const url = ${client.path.template} as const
       return ${hook.name}<${hook.generics}>(
        shouldFetch ? url : null,
        (_url${client.withData ? ', { arg: data }' : ''}) => {
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
  const operation = useOperation()
  const name = useOperationName({ type: 'function' })
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

  const resultGenerics = [
    'ResponseConfig<TData>',
    'TError',
  ]

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
      enabled: client.withQueryParams,
      required: false,
    },
    {
      name: 'headers',
      type: schemas.headerParams?.name,
      enabled: client.withHeaders,
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
    generics: [...resultGenerics, client.withQueryParams ? `[typeof url, typeof params] | null` : 'typeof url | null'].join(', '),
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
  const { options: { clientImportPath } } = usePlugin<PluginOptions>()
  const schemas = useSchemas()
  const file = useOperationFile()
  const fileType = useOperationFile({ pluginKey: swaggerTsPluginKey })

  const Template = templates.default

  return (
    <>
      <File<FileMeta>
        baseName={file.baseName}
        path={file.path}
        meta={file.meta}
      >
        <File.Import name="useSWRMutation" path="swr/mutation" />
        <File.Import name={['SWRMutationConfiguration', 'SWRMutationResponse']} path="swr/mutation" isTypeOnly />
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
          <Mutation
            Template={Template}
          />
        </File.Source>
      </File>
    </>
  )
}

Mutation.templates = defaultTemplates
