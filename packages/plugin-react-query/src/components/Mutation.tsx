import transformers from '@kubb/core/transformers'
import { FunctionParams, URLPath } from '@kubb/core/utils'
import { useOperation, useOperationManager } from '@kubb/plugin-oas/hooks'
import { getASTParams, getComments } from '@kubb/plugin-oas/utils'
import { File, Function, useApp } from '@kubb/react'
import { pluginTsName } from '@kubb/plugin-ts'

import { SchemaType } from './SchemaType.tsx'

import { isRequired } from '@kubb/oas'
import type { HttpMethod } from '@kubb/oas'
import type { ComponentProps, ComponentType, ReactNode } from 'react'
import type { FileMeta, PluginReactQuery } from '../types.ts'

type TemplateProps = {
  /**
   * Name of the function
   */
  name: string
  /**
   * Parameters/options/props that need to be used
   */
  params: string
  mutateParams: string
  /**
   * Options for JSdocs
   */
  JSDoc?: {
    comments: string[]
  }
  hook: {
    name: string
    generics?: string
    children?: string
  }
  client: {
    generics: string
    method: HttpMethod
    path: URLPath
    withQueryParams: boolean
    withPathParams: boolean
    withData: boolean
    withHeaders: boolean
    contentType: string
  }
  dataReturnType: NonNullable<PluginReactQuery['options']['dataReturnType']>
}

function Template({ name, params, mutateParams, JSDoc, client, hook, dataReturnType }: TemplateProps): ReactNode {
  const isFormData = client.contentType === 'multipart/form-data'
  const headers = [
    client.contentType !== 'application/json' ? `'Content-Type': '${client.contentType}'` : undefined,
    client.withHeaders ? '...headers' : undefined,
  ]
    .filter(Boolean)
    .join(', ')

  const clientOptions = [
    `method: "${client.method}"`,
    `url: ${client.path.template}`,
    client.withQueryParams ? 'params' : undefined,
    client.withData && !isFormData ? 'data' : undefined,
    client.withData && isFormData ? 'data: formData' : undefined,
    headers.length ? `headers: { ${headers}, ...clientOptions.headers }` : undefined,
    '...clientOptions',
  ].filter(Boolean)

  const resolvedClientOptions = `${transformers.createIndent(4)}${clientOptions.join(`,\n${transformers.createIndent(4)}`)}`

  const formData = isFormData
    ? `
   const formData = new FormData()
   if(data) {
    Object.keys(data).forEach((key) => {
      const value = data[key];
      if (typeof key === "string" && (typeof value === "string" || value instanceof Blob)) {
        formData.append(key, value);
      }
    })
   }
  `
    : undefined

  return (
    <File.Source name={name} isExportable isIndexable>
      <Function export name={name} params={params} JSDoc={JSDoc}>
        {`
         const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}

         return ${hook.name}({
           mutationFn: async(${mutateParams}) => {
             ${hook.children || ''}
             ${formData || ''}
             const res = await client<${client.generics}>({
              ${resolvedClientOptions}
             })

             return ${dataReturnType === 'data' ? 'res.data' : 'res'}
           },
           ...mutationOptions
         })`}
      </Function>
    </File.Source>
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
        mutate,
      },
    },
  } = useApp<PluginReactQuery>()

  const { getSchemas, getFile } = useOperationManager()
  const operation = useOperation()

  const schemas = getSchemas(operation, { pluginKey: [pluginTsName], type: 'type' })
  const file = getFile(operation)
  const fileType = getFile(operation, { pluginKey: [pluginTsName] })

  return (
    <File<FileMeta> baseName={file.baseName} path={file.path} meta={file.meta}>
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
      <File.Import
        name={['UseMutationOptions', 'UseMutationResult']}
        path={typeof mutate !== 'boolean' && mutate.importPath ? mutate.importPath : '@tanstack/react-query'}
        isTypeOnly
      />
      <File.Import name={['useMutation']} path={typeof mutate !== 'boolean' && mutate.importPath ? mutate.importPath : '@tanstack/react-query'} />
      {children}
    </File>
  )
}

const defaultTemplates = { default: Template, root: RootTemplate } as const

type Templates = Partial<typeof defaultTemplates>

type MutationProps = {
  /**
   * This will make it possible to override the default behaviour.
   */
  Template?: ComponentType<ComponentProps<typeof Template>>
}

export function Mutation({ Template = defaultTemplates.default }: MutationProps): ReactNode {
  // TODO do checks on pathParamsType

  const {
    plugin: {
      options: { dataReturnType, mutate },
    },
  } = useApp<PluginReactQuery>()

  const operation = useOperation()
  const { getSchemas, getName } = useOperationManager()

  const name = getName(operation, { type: 'function' })
  const schemas = getSchemas(operation, { pluginKey: [pluginTsName], type: 'type' })
  const contentType = operation.getContentType()

  const params = new FunctionParams()
  const mutateParams = new FunctionParams()
  const factoryName = getName(operation, { type: 'type' })

  const requestType =
    mutate && mutate.variablesType === 'mutate'
      ? FunctionParams.toObject([
          ...getASTParams(schemas.pathParams, { typed: true }),
          {
            name: 'params',
            type: `${factoryName}['queryParams']`,
            enabled: !!schemas.queryParams?.name,
            required: isRequired(schemas.queryParams?.schema),
          },
          {
            name: 'headers',
            type: `${factoryName}['headerParams']`,
            enabled: !!schemas.headerParams?.name,
            required: isRequired(schemas.headerParams?.schema),
          },
          {
            name: 'data',
            type: `${factoryName}['request']`,
            enabled: !!schemas.request?.name,
            required: isRequired(schemas.request?.schema),
          },
        ])?.type
      : schemas.request?.name
        ? `${factoryName}['request']`
        : 'never'

  const client = {
    method: operation.method,
    path: new URLPath(operation.path),
    generics: [`${factoryName}["data"]`, `${factoryName}["error"]`, requestType ? `${factoryName}["request"]` : 'void'].join(', '),
    withQueryParams: !!schemas.queryParams?.name,
    withData: !!schemas.request?.name,
    withPathParams: !!schemas.pathParams?.name,
    withHeaders: !!schemas.headerParams?.name,
    contentType,
  }
  const hook = {
    name: 'useMutation',
    generics: [`${factoryName}['response']`, `${factoryName}["error"]`, requestType ? `${requestType}` : 'void'].join(', '),
  }

  const resultGenerics = [
    `${factoryName}["response"]`,
    `${factoryName}["error"]`,
    mutate && mutate?.variablesType === 'mutate' ? requestType : `${factoryName}["request"]`,
  ]

  if (mutate && mutate?.variablesType === 'mutate') {
    params.add([
      {
        name: 'options',
        type: `{
      mutation?: UseMutationOptions<${resultGenerics.join(', ')}>,
      client?: ${factoryName}['client']['parameters']
  }`,
        default: '{}',
      },
    ])

    mutateParams.add([
      [
        ...getASTParams(schemas.pathParams, { typed: false }),
        {
          name: 'params',
          enabled: client.withQueryParams,
          required: isRequired(schemas.queryParams?.schema),
        },
        {
          name: 'headers',
          enabled: client.withHeaders,
          required: isRequired(schemas.headerParams?.schema),
        },
        {
          name: 'data',
          enabled: !!schemas.request?.name,
          required: isRequired(schemas.request?.schema),
        },
      ],
    ])
  } else {
    params.add([
      ...getASTParams(schemas.pathParams, { typed: true }),
      {
        name: 'params',
        type: `${factoryName}['queryParams']`,
        enabled: client.withQueryParams,
        required: isRequired(schemas.queryParams?.schema),
      },
      {
        name: 'headers',
        type: `${factoryName}['headerParams']`,
        enabled: client.withHeaders,
        required: isRequired(schemas.headerParams?.schema),
      },
      {
        name: 'options',
        type: `{
      mutation?: UseMutationOptions<${resultGenerics.join(', ')}>,
      client?: ${factoryName}['client']['parameters']
  }`,
        default: '{}',
      },
    ])

    mutateParams.add([
      {
        name: 'data',
        enabled: !!schemas.request?.name,
        required: isRequired(schemas.request?.schema),
      },
    ])
  }

  if (!mutate) {
    return null
  }

  return (
    <>
      <Template
        name={name}
        JSDoc={{ comments: getComments(operation) }}
        client={client}
        hook={hook}
        params={params.toString()}
        mutateParams={mutateParams.toString()}
        dataReturnType={dataReturnType}
      />
    </>
  )
}

type FileProps = {
  /**
   * This will make it possible to override the default behaviour.
   */
  templates?: Templates
}

Mutation.File = function ({ ...props }: FileProps): ReactNode {
  const templates = { ...defaultTemplates, ...props.templates }

  const Template = templates.default
  const RootTemplate = templates.root

  return (
    <RootTemplate>
      <SchemaType />
      <Mutation Template={Template} />
    </RootTemplate>
  )
}

Mutation.templates = defaultTemplates
