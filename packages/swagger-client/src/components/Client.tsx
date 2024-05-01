import { URLPath } from '@kubb/core/utils'
import { Editor, File, Function, useApp } from '@kubb/react'
import { pluginKey as swaggerTsPluginKey } from '@kubb/swagger-ts'
import { useOperation, useOperationManager } from '@kubb/swagger/hooks'
import { getComments, getPathParams } from '@kubb/swagger/utils'

import { isOptional } from '@kubb/oas'
import type { HttpMethod } from '@kubb/oas'
import type { KubbNode, Params } from '@kubb/react'
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
  params: Params
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
    generics: string | string[]
    method: HttpMethod
    path: URLPath
    dataReturnType: PluginOptions['options']['dataReturnType']
    withQueryParams: boolean
    withData: boolean
    withHeaders: boolean
  }
}

function Template({ name, generics, returnType, params, JSDoc, client }: TemplateProps): KubbNode {
  return (
    <Function name={name} async export generics={generics} returnType={returnType} params={params} JSDoc={JSDoc}>
      <Function.Call
        name="res"
        to={
          <Function
            name="client"
            async
            generics={client.generics}
            params={{
              data: {
                mode: 'object',
                children: {
                  method: {
                    value: JSON.stringify(client.method),
                  },
                  url: {
                    value: client.path.template,
                  },
                  params: client.withQueryParams ? {} : undefined,
                  data: client.withData ? {} : undefined,
                  headers: client.withHeaders
                    ? {
                        value: '{ ...headers, ...options.headers }',
                      }
                    : undefined,
                  options: {
                    mode: 'inlineSpread',
                  },
                },
              },
            }}
          />
        }
      />
      <Function.Return>{client.dataReturnType === 'data' ? 'res.data' : 'res'}</Function.Return>
    </Function>
  )
}

type RootTemplateProps = {
  children?: React.ReactNode
}

function RootTemplate({ children }: RootTemplateProps) {
  const {
    plugin: {
      options: {
        client: { importPath },
      },
    },
  } = useApp<PluginOptions>()

  const { getSchemas, getFile } = useOperationManager()
  const operation = useOperation()

  const file = getFile(operation)
  const fileType = getFile(operation, { pluginKey: swaggerTsPluginKey })
  const schemas = getSchemas(operation)

  return (
    <Editor language="typescript">
      <File<FileMeta> baseName={file.baseName} path={file.path} meta={file.meta}>
        <File.Import name={'client'} path={importPath} />
        <File.Import name={['ResponseConfig']} path={importPath} isTypeOnly />
        <File.Import
          name={[schemas.request?.name, schemas.response.name, schemas.pathParams?.name, schemas.queryParams?.name, schemas.headerParams?.name].filter(Boolean)}
          root={file.path}
          path={fileType.path}
          isTypeOnly
        />
        <File.Source>{children}</File.Source>
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

export function Client({ Template = defaultTemplates.default }: ClientProps): KubbNode {
  const {
    plugin: {
      options: { dataReturnType, pathParamsType },
    },
  } = useApp<PluginOptions>()

  const { getSchemas, getName } = useOperationManager()
  const operation = useOperation()

  const name = getName(operation, { type: 'function' })
  const schemas = getSchemas(operation)

  return (
    <Template
      name={name}
      params={{
        pathParams: {
          mode: pathParamsType === 'object' ? 'object' : 'inlineSpread',
          children: getPathParams(schemas.pathParams, { typed: true }),
        },
        data: schemas.request?.name
          ? {
              type: schemas.request?.name,
              optional: isOptional(schemas.request?.schema),
            }
          : undefined,
        params: schemas.queryParams?.name
          ? {
              type: schemas.queryParams?.name,
              optional: isOptional(schemas.queryParams?.schema),
            }
          : undefined,
        headers: schemas.headerParams?.name
          ? {
              type: schemas.headerParams?.name,
              optional: isOptional(schemas.headerParams?.schema),
            }
          : undefined,
        options: {
          type: 'Partial<Parameters<typeof client>[0]>',
          default: '{}',
        },
      }}
      returnType={dataReturnType === 'data' ? `ResponseConfig<${schemas.response.name}>["data"]` : `ResponseConfig<${schemas.response.name}>`}
      JSDoc={{
        comments: getComments(operation),
      }}
      client={{
        generics: [schemas.response.name, schemas.request?.name].filter(Boolean),
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

Client.File = function (props: FileProps): KubbNode {
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
