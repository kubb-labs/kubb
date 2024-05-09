import { URLPath } from '@kubb/core/utils'
import { Parser, File, Function, useApp } from '@kubb/react'
import { pluginTsName } from '@kubb/swagger-ts'
import { useOperation, useOperationManager } from '@kubb/plugin-oas/hooks'
import { getComments, getPathParams } from '@kubb/plugin-oas/utils'

import { isOptional } from '@kubb/oas'
import type { HttpMethod } from '@kubb/oas'
import type { KubbNode, Params } from '@kubb/react'
import type { ComponentProps, ComponentType } from 'react'
import type { FileMeta, PluginClient } from '../types.ts'

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
    dataReturnType: PluginClient['options']['dataReturnType']
    withQueryParams: boolean
    withData: boolean
    withHeaders: boolean
  }
}

function Template({ name, generics, returnType, params, JSDoc, client }: TemplateProps): KubbNode {
  const clientParams: Params = {
    data: {
      mode: 'object',
      children: {
        method: {
          type: 'string',
          value: JSON.stringify(client.method),
        },
        url: {
          type: 'string',
          value: client.path.template,
        },
        params: client.withQueryParams
          ? {
              type: 'any',
            }
          : undefined,
        data: client.withData
          ? {
              type: 'any',
            }
          : undefined,
        headers: client.withHeaders
          ? {
              type: 'any',
              value: '{ ...headers, ...options.headers }',
            }
          : undefined,
        options: {
          type: 'any',
          mode: 'inlineSpread',
        },
      },
    },
  }

  return (
    <Function name={name} async export generics={generics} returnType={returnType} params={params} JSDoc={JSDoc}>
      <Function.Call name="res" to={<Function name="client" async generics={client.generics} params={clientParams} />} />
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
  } = useApp<PluginClient>()

  const { getSchemas, getFile } = useOperationManager()
  const operation = useOperation()

  const file = getFile(operation)
  const fileType = getFile(operation, { pluginKey: [pluginTsName] })
  const schemas = getSchemas(operation)

  return (
    <Parser language="typescript">
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
    </Parser>
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
  } = useApp<PluginClient>()

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
