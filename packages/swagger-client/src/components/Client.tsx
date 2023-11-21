import { FunctionParams, transformers } from '@kubb/core/utils'
import { URLPath } from '@kubb/core/utils'
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
  const clientOptions = [
    `method: "${client.method}"`,
    `url: ${client.path.template}`,
    client.withQueryParams ? 'params' : undefined,
    client.withData ? 'data' : undefined,
    client.withHeaders ? 'headers: { ...headers, ...options.headers }' : undefined,
    '...options',
  ].filter(Boolean)

  const resolvedClientOptions = `${transformers.createIndent(4)}${clientOptions.join(`,\n${transformers.createIndent(4)}`)}`

  if (client.dataReturnType === 'full') {
    return (
      <Function name={name} async export generics={generics} returnType={returnType} params={params} JSDoc={JSDoc}>
        {`
  return client<${client.generics}>({
${resolvedClientOptions}
  });`}
      </Function>
    )
  }

  return (
    <Function name={name} async export generics={generics} returnType={returnType} params={params} JSDoc={JSDoc}>
      {`
const { data: resData } = await client<${client.generics}>({
${resolvedClientOptions}
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
  const { options: { dataReturnType, pathParamsType } } = usePlugin<PluginOptions>()
  const schemas = useSchemas()
  const operation = useOperation()
  const name = useOperationName({ type: 'function' })

  const params = new FunctionParams()
  const clientGenerics = new FunctionParams()

  clientGenerics.add([{ type: schemas.response.name }, { type: schemas.request?.name, enabled: !!schemas.request?.name }])

  params.add([
    ...getASTParams(schemas.pathParams, { typed: true, asObject: pathParamsType === 'object' }),
    {
      name: 'data',
      type: schemas.request?.name,
      enabled: !!schemas.request?.name,
      required: Array.isArray(schemas.request?.schema.required) ? !!schemas.request?.schema.required?.length : !!schemas.request?.schema.required,
    },
    {
      name: 'params',
      type: schemas.queryParams?.name,
      enabled: !!schemas.queryParams?.name,
      required: Array.isArray(schemas.queryParams?.schema.required) ? !!schemas.queryParams?.schema.required?.length : !!schemas.queryParams?.schema.required,
    },
    {
      name: 'headers',
      type: schemas.headerParams?.name,
      enabled: !!schemas.headerParams?.name,
      required: Array.isArray(schemas.headerParams?.schema.required)
        ? !!schemas.headerParams?.schema.required?.length
        : !!schemas.headerParams?.schema.required,
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
  const { options: { clientImportPath } } = usePlugin<PluginOptions>()
  const schemas = useSchemas()
  const file = useOperationFile()
  const fileType = useOperationFile({ pluginKey: swaggerTsPluginKey })

  const Template = templates.default

  return (
    <File<FileMeta>
      baseName={file.baseName}
      path={file.path}
      meta={file.meta}
    >
      <File.Import name={'client'} path={clientImportPath} />
      <File.Import name={['ResponseConfig']} path={clientImportPath} isTypeOnly />
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
