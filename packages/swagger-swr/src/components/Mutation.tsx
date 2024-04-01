import transformers from '@kubb/core/transformers'
import { FunctionParams, URLPath } from '@kubb/core/utils'
import { Editor, File, Function, useApp } from '@kubb/react'
import { pluginKey as swaggerTsPluginKey } from '@kubb/swagger-ts'
import { useOperation, useOperationManager } from '@kubb/swagger/hooks'
import { getASTParams, getComments } from '@kubb/swagger/utils'

import { SchemaType } from './SchemaType.tsx'

import type { HttpMethod } from '@kubb/swagger/oas'
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
  dataReturnType: NonNullable<PluginOptions['options']['dataReturnType']>
}

function Template({ name, generics, returnType, params, JSDoc, client, hook, dataReturnType }: TemplateProps): ReactNode {
  const clientOptions = [
    `method: "${client.method}"`,
    'url',
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
          async (_url${client.withData ? ', { arg: data }' : ''}) => {
            const res = await client<${client.generics}>({
              ${resolvedClientOptions}
            })

            return ${dataReturnType === 'data' ? 'res.data' : 'res'}
          },
          mutationOptions
        )
      `}
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
        async (_url${client.withData ? ', { arg: data }' : ''}) => {
          const res = await client<${client.generics}>({
            ${resolvedClientOptions}
          })

          return ${dataReturnType === 'data' ? 'res.data' : 'res'}
        },
        mutationOptions
      )
    `}
    </Function>
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
}

export function Mutation({ factory, Template = defaultTemplates.default }: Props): ReactNode {
  const {
    plugin: {
      options: { dataReturnType },
    },
  } = useApp<PluginOptions>()
  const { getSchemas, getName } = useOperationManager()
  const operation = useOperation()

  const name = getName(operation, { type: 'function' })
  const schemas = getSchemas(operation)

  const params = new FunctionParams()
  const client = {
    method: operation.method,
    path: new URLPath(operation.path),
    generics: [`${factory.name}["data"]`, `${factory.name}["error"]`, schemas.request?.name ? `${factory.name}["request"]` : ''].filter(Boolean).join(', '),
    withQueryParams: !!schemas.queryParams?.name,
    withData: !!schemas.request?.name,
    withPathParams: !!schemas.pathParams?.name,
    withHeaders: !!schemas.headerParams?.name,
  }

  const resultGenerics = [`${factory.name}["response"]`, `${factory.name}["error"]`]

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
        mutation?: SWRMutationConfiguration<${resultGenerics.join(', ')}>,
        client?: ${factory.name}['client']['parameters'],
        shouldFetch?: boolean,
      }`,
      default: '{}',
    },
  ])

  const hook = {
    name: 'useSWRMutation',
    generics: [...resultGenerics, client.withQueryParams ? '[typeof url, typeof params] | null' : 'typeof url | null'].join(', '),
  }

  return (
    <Template
      name={name}
      JSDoc={{ comments: getComments(operation) }}
      client={client}
      hook={hook}
      params={params.toString()}
      returnType={`SWRMutationResponse<${resultGenerics.join(', ')}>`}
      dataReturnType={dataReturnType}
    />
  )
}

type FileProps = {
  /**
   * This will make it possible to override the default behaviour.
   */
  templates?: typeof defaultTemplates
}

Mutation.File = function ({ templates = defaultTemplates }: FileProps): ReactNode {
  const {
    plugin: {
      options: {
        client: { importPath },
      },
    },
  } = useApp<PluginOptions>()

  const { getSchemas, getFile, getName } = useOperationManager()
  const operation = useOperation()

  const schemas = getSchemas(operation)
  const file = getFile(operation)
  const fileType = getFile(operation, { pluginKey: swaggerTsPluginKey })
  const factoryName = getName(operation, { type: 'type' })

  const Template = templates.default
  const factory = {
    name: factoryName,
  }

  return (
    <Editor language="typescript">
      <File<FileMeta> baseName={file.baseName} path={file.path} meta={file.meta}>
        <File.Import name="useSWRMutation" path="swr/mutation" />
        <File.Import name={['SWRMutationConfiguration', 'SWRMutationResponse']} path="swr/mutation" isTypeOnly />
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

        <File.Source>
          <SchemaType factory={factory} />
          <Mutation Template={Template} factory={factory} />
        </File.Source>
      </File>
    </Editor>
  )
}

Mutation.templates = defaultTemplates
