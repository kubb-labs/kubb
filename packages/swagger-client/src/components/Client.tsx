import path from 'node:path'

import { FunctionParams, getRelativePath, transformers } from '@kubb/core/utils'
import { URLPath } from '@kubb/core/utils'
import { File, Function, usePlugin, usePluginManager } from '@kubb/react'
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
  client: {
    generics: string
    method: HttpMethod
    path: URLPath
    dataReturnType: PluginOptions['options']['dataReturnType']
    withQueryParams: boolean
    withData: boolean
    withHeaders: boolean
  }
}

function Template({
  name,
  generics,
  returnType,
  params,
  JSDoc,
  client,
}: TemplateProps): ReactNode {
  const clientParams = [
    `method: "${client.method}"`,
    `url: ${client.path.template}`,
    client.withQueryParams ? 'params' : undefined,
    client.withData ? 'data' : undefined,
    client.withHeaders ? 'headers: { ...headers, ...options.headers }' : undefined,
    '...options',
  ].filter(Boolean)

  const clientOptions = `${transformers.createIndent(4)}${clientParams.join(`,\n${transformers.createIndent(4)}`)}`

  if (client.dataReturnType === 'full') {
    return (
      <Function name={name} async export generics={generics} returnType={returnType} params={params} JSDoc={JSDoc}>
        {`
  return client<${client.generics}>({
${clientOptions}
  });`}
      </Function>
    )
  }

  return (
    <Function name={name} async export generics={generics} returnType={returnType} params={params} JSDoc={JSDoc}>
      {`
const { data: resData } = await client<${client.generics}>({
${clientOptions}
});

return resData;`}
    </Function>
  )
}

const defaultTemplates = { default: Template } as const

type ClientProps = {
  /**
   * This will make it possible to override the default behaviour.
   */
  Template?: React.ComponentType<React.ComponentProps<typeof Template>>
}

export function Client({
  Template = defaultTemplates.default,
}: ClientProps): ReactNode {
  const { key: pluginKey, options } = usePlugin<PluginOptions>()
  const schemas = useSchemas()
  const operation = useOperation()
  const { name } = useResolve({ pluginKey, type: 'function' })

  const { dataReturnType, pathParamsType } = options
  const params = new FunctionParams()
  const clientGenerics = new FunctionParams()

  clientGenerics.add([{ type: schemas.response.name }, { type: schemas.request?.name, enabled: !!schemas.request?.name }])

  params.add([
    ...getASTParams(schemas.pathParams, { typed: true, asObject: pathParamsType === 'object' }),
    {
      name: 'data',
      type: schemas.request?.name,
      enabled: !!schemas.request?.name,
      required: !!schemas.request?.schema.required?.length,
    },
    {
      name: 'params',
      type: schemas.queryParams?.name,
      enabled: !!schemas.queryParams?.name,
      required: !!schemas.queryParams?.schema.required?.length,
    },
    {
      name: 'headers',
      type: schemas.headerParams?.name,
      enabled: !!schemas.headerParams?.name,
      required: !!schemas.headerParams?.schema.required?.length,
    },
    {
      name: 'options',
      type: `Partial<Parameters<typeof client>[0]>`,
      default: '{}',
    },
  ])

  return (
    <Template
      name={name}
      params={params.toString()}
      returnType={dataReturnType === 'data' ? `ResponseConfig<${schemas.response.name}>["data"]` : `ResponseConfig<${schemas.response.name}>`}
      JSDoc={{
        comments: getComments(operation),
      }}
      client={{
        generics: clientGenerics.toString(),
        dataReturnType,
        withQueryParams: !!schemas.queryParams?.name,
        withData: !!schemas.request?.name,
        withHeaders: !!schemas.headerParams?.name,
        method: operation.method,
        path: new URLPath(operation.path),
      }}
    />
  )
}

type FileProps = {
  /**
   * This will make it possible to override the default behaviour.
   */
  templates?: typeof defaultTemplates
}

Client.File = function({ templates = defaultTemplates }: FileProps): ReactNode {
  const { key: pluginKey, options } = usePlugin<PluginOptions>()
  const { config } = usePluginManager()
  const schemas = useSchemas()
  const operation = useOperation()
  const file = useResolve({ pluginKey, type: 'file' })
  const fileType = useResolveType({ type: 'file' })

  const { clientImportPath, client } = options
  const root = path.resolve(config.root, config.output.path)
  const clientPath = client ? path.resolve(root, 'client.ts') : undefined
  const resolvedClientPath = clientImportPath ? clientImportPath : clientPath ? getRelativePath(file.path, clientPath) : '@kubb/swagger-client/client'

  const Template = templates.default

  return (
    <File<FileMeta>
      baseName={file.baseName}
      path={file.path}
      meta={{
        pluginKey,
        // needed for the `output.groupBy`
        tag: operation.getTags()[0]?.name,
      }}
    >
      <File.Import name={'client'} path={resolvedClientPath} />
      <File.Import name={['ResponseConfig']} path={resolvedClientPath} isTypeOnly />
      <File.Import
        name={[schemas.request?.name, schemas.response.name, schemas.pathParams?.name, schemas.queryParams?.name, schemas.headerParams?.name].filter(
          Boolean,
        )}
        root={file.path}
        path={fileType.path}
        isTypeOnly
      />
      <File.Source>
        <Client Template={Template} />
      </File.Source>
    </File>
  )
}

Client.templates = defaultTemplates
