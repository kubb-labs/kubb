import transformers from '@kubb/core/transformers'
import { FunctionParams } from '@kubb/core/utils'
import { URLPath } from '@kubb/core/utils'
import { Editor, File, Function, usePlugin } from '@kubb/react'
import { useGetOperationFile, useOperation, useOperationName, useSchemas } from '@kubb/swagger/hooks'
import { getASTParams, getComments, isRequired } from '@kubb/swagger/utils'
import { pluginKey as swaggerTsPluginKey } from '@kubb/swagger-ts'

import type { KubbNode } from '@kubb/react'
import type { HttpMethod } from '@kubb/swagger/oas'
import type { ComponentProps, ComponentType } from 'react'
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
}: TemplateProps): KubbNode {
  const clientOptions = [
    `method: "${client.method}"`,
    `url: ${client.path.template}`,
    client.withQueryParams ? 'params' : undefined,
    client.withData ? 'data' : undefined,
    client.withHeaders ? 'headers: { ...headers, ...options.headers }' : undefined,
    '...options',
  ].filter(Boolean)

  const resolvedClientOptions = `${transformers.createIndent(4)}${clientOptions.join(`,\n${transformers.createIndent(4)}`)}`

  return (
    <Function name={name} async export generics={generics} returnType={returnType} params={params} JSDoc={JSDoc}>
      {`
const res = await client<${client.generics}>({
${resolvedClientOptions}
})
return ${client.dataReturnType === 'data' ? 'res.data' : 'res'}
`}
    </Function>
  )
}

type RootTemplateProps = {
  children?: React.ReactNode
}

function RootTemplate({ children }: RootTemplateProps) {
  const { options: { client: { importPath } } } = usePlugin<PluginOptions>()

  const schemas = useSchemas()
  const file = useGetOperationFile()
  const fileType = useGetOperationFile({ pluginKey: swaggerTsPluginKey })

  return (
    <Editor language="typescript">
      <File<FileMeta>
        baseName={file.baseName}
        path={file.path}
        meta={file.meta}
      >
        <File.Import name={'client'} path={importPath} />
        <File.Import name={['ResponseConfig']} path={importPath} isTypeOnly />
        <File.Import
          name={[schemas.request?.name, schemas.response.name, schemas.pathParams?.name, schemas.queryParams?.name, schemas.headerParams?.name].filter(
            Boolean,
          )}
          root={file.path}
          path={fileType.path}
          isTypeOnly
        />
        <File.Source>
          {children}
        </File.Source>
      </File>
    </Editor>
  )
}

const defaultTemplates = { default: Template, root: RootTemplate } as const

type Templates = Partial<typeof defaultTemplates>

type ClientProps = {
  /**
   * This will make it possible to override the default behaviour.
   */
  Template?: ComponentType<ComponentProps<typeof Template>>
}

export function Client({
  Template = defaultTemplates.default,
}: ClientProps): KubbNode {
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
      required: isRequired(schemas.request?.schema),
    },
    {
      name: 'params',
      type: schemas.queryParams?.name,
      enabled: !!schemas.queryParams?.name,
      required: isRequired(schemas.queryParams?.schema),
    },
    {
      name: 'headers',
      type: schemas.headerParams?.name,
      enabled: !!schemas.headerParams?.name,
      required: isRequired(schemas.headerParams?.schema),
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
  templates?: Templates
}

Client.File = function(props: FileProps): KubbNode {
  const templates = { ...defaultTemplates, ...props.templates }

  const Template = templates.default
  const RootTemplate = templates.root

  return (
    <RootTemplate>
      <Client Template={Template} />
    </RootTemplate>
  )
}

Client.templates = defaultTemplates
