import path from 'node:path'

import { FunctionParams, getRelativePath, transformers, URLPath } from '@kubb/core/utils'
import { File, Function, Type, usePlugin, usePluginManager } from '@kubb/react'
import { useOperation, useResolve, useSchemas } from '@kubb/swagger/hooks'
import { getASTParams, getComments } from '@kubb/swagger/utils'
import { useResolve as useResolveType } from '@kubb/swagger-ts/hooks'

import { camelCase, pascalCase, pascalCaseTransformMerge } from 'change-case'

import { getImportNames } from '../utils.ts'
import { MutationImports } from './MutationImports.tsx'

import type { HttpMethod } from '@kubb/swagger'
import type { ReactNode } from 'react'
import type { FileMeta, PluginOptions } from '../types.ts'

type Factory = {
  name: string
  generics: [data: string, error: string, request: string, pathParams: string, queryParams: string, headerParams: string, response: string, options: string]
}

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
    children?: string
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
    `url: ${client.path.template}`,
    client.withQueryParams ? 'params' : undefined,
    client.withData ? 'data' : undefined,
    client.withHeaders ? 'headers: { ...headers, ...clientOptions.headers }' : undefined,
    '...clientOptions',
  ].filter(Boolean)

  const resolvedClientOptions = `${transformers.createIndent(4)}${clientOptions.join(`,\n${transformers.createIndent(4)}`)}`

  return (
    <Function export name={name} generics={generics} returnType={returnType} params={params} JSDoc={JSDoc}>
      {`
       const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}

       return ${hook.name}<${hook.generics}>({
         mutationFn: (${client.withData ? 'data' : ''}) => {
          ${hook.children || ''}
           return client<${client.generics}>({
            ${resolvedClientOptions}
           }).then(res => res as TData)
         },
         ...mutationOptions
       })`}
    </Function>
  )
}

type FrameworkProps = TemplateProps & {
  context: {
    factory: {
      name: string
    }
  }
}

const defaultTemplates = {
  get react() {
    return function(props: FrameworkProps): ReactNode {
      return (
        <Template
          {...props}
        />
      )
    }
  },
  get solid() {
    return function(props: FrameworkProps): ReactNode {
      return (
        <Template
          {...props}
        />
      )
    }
  },
  get svelte() {
    return function(props: FrameworkProps): ReactNode {
      return (
        <Template
          {...props}
        />
      )
    }
  },
  get vue() {
    return function(
      { client, context, ...rest }: FrameworkProps,
    ): ReactNode {
      const { factory } = context

      const importNames = getImportNames()

      const hookName = importNames.mutation.vue.hookName
      const resultType = importNames.mutation.vue.resultType
      const optionsType = importNames.mutation.vue.optionsType
      const schemas = useSchemas()
      const params = new FunctionParams()

      const resultGenerics = [
        'TData',
        'TError',
        client.withData ? `${factory.name}["request"]` : 'void',
        'unknown',
      ]

      params.add([
        ...getASTParams(schemas.pathParams, {
          typed: true,
          override: (item) => ({ ...item, name: item.name ? `ref${pascalCase(item.name)}` : undefined, enabled: !!item.name, type: `MaybeRef<${item.type}>` }),
        }),
        {
          name: 'refParams',
          type: `MaybeRef<${schemas.queryParams?.name}>`,
          enabled: client.withQueryParams,
          required: !!schemas.queryParams?.schema.required?.length,
        },
        {
          name: 'refHeaders',
          type: `MaybeRef<${schemas.headerParams?.name}>`,
          enabled: client.withHeaders,
          required: !!schemas.headerParams?.schema.required?.length,
        },
        {
          name: 'options',
          type: `{
        mutation?: ${optionsType}<${resultGenerics.join(', ')}>,
        client?: ${factory.name}['client']['paramaters']
    }`,
          default: '{}',
        },
      ])

      const unrefs = params.items
        .filter((item) => item.enabled)
        .map((item) => {
          return item.name ? `const ${camelCase(item.name.replace('ref', ''))} = unref(${item.name})` : undefined
        })
        .join('\n')

      const hook = {
        name: hookName,
        generics: [
          'TData',
          'TError',
          client.withData ? `${factory.name}["request"]` : 'void',
          'unknown',
        ].join(', '),
        children: unrefs,
      }

      return (
        <>
          <Template
            {...rest}
            params={params.toString()}
            returnType={`${resultType}<${resultGenerics.join(', ')}>`}
            client={client}
            hook={hook}
          />
        </>
      )
    }
  },
} as const

type Props = {
  resultType: string
  hookName: string
  optionsType: string
  /**
   * This will make it possible to override the default behaviour.
   */
  Template?: React.ComponentType<FrameworkProps>
}

export function Mutation({
  resultType,
  hookName,
  optionsType,
  Template = defaultTemplates.react,
}: Props): ReactNode {
  const { key: pluginKey, options } = usePlugin<PluginOptions>()
  const operation = useOperation()
  const { name } = useResolve({
    pluginKey,
    type: 'function',
  })
  const schemas = useSchemas()

  const factory: Factory = {
    name: pascalCase(operation.getOperationId(), { delimiter: '', transform: pascalCaseTransformMerge }),
    generics: [
      schemas.response.name,
      schemas.errors?.map((error) => error.name).join(' | ') || 'never',
      schemas.request?.name || 'never',
      schemas.pathParams?.name || 'never',
      schemas.queryParams?.name || 'never',
      schemas.headerParams?.name || 'never',
      schemas.response.name,
      `{ dataReturnType: '${options.dataReturnType}'; type: 'mutation' }`,
    ],
  }
  const generics = new FunctionParams()
  const params = new FunctionParams()
  const client = {
    method: operation.method,
    path: new URLPath(operation.path),
    generics: [
      `${factory.name}["data"]`,
      'TError',
      schemas.request?.name ? `${factory.name}["request"]` : 'void',
    ].join(', '),
    withQueryParams: !!schemas.queryParams?.name,
    withData: !!schemas.request?.name,
    withPathParams: !!schemas.pathParams?.name,
    withHeaders: !!schemas.headerParams?.name,
  }
  const hook = {
    name: hookName,
    generics: [
      'TData',
      'TError',
      client.withData ? `${factory.name}["request"]` : 'void',
    ].join(', '),
  }

  const resultGenerics = [
    'TData',
    'TError',
    client.withData ? `${factory.name}["request"]` : 'void',
  ]

  generics.add([
    { type: 'TData', default: `${factory.name}["response"]` },
    { type: 'TError', default: `${factory.name}["error"]` },
  ])

  params.add([
    ...getASTParams(schemas.pathParams, {
      typed: true,
    }),
    {
      name: 'params',
      type: `${factory.name}['queryParams']`,
      enabled: client.withQueryParams,
      required: !!schemas.queryParams?.schema.required?.length,
    },
    {
      name: 'headers',
      type: `${factory.name}['headerParams']`,
      enabled: client.withHeaders,
      required: !!schemas.headerParams?.schema.required?.length,
    },
    {
      name: 'options',
      type: `{
    mutation?: ${optionsType}<${resultGenerics.join(', ')}>,
    client?: ${factory.name}['client']['paramaters']
}`,
      default: '{}',
    },
  ])

  return (
    <>
      <Type name={factory.name}>
        {`KubbQueryFactory<${factory.generics.join(', ')}>`}
      </Type>
      <Template
        name={name}
        generics={generics.toString()}
        JSDoc={{ comments: getComments(operation) }}
        client={client}
        hook={hook}
        params={params.toString()}
        returnType={`${resultType}<${resultGenerics.join(', ')}>`}
        context={{ factory }}
      />
    </>
  )
}

type FileProps = {
  /**
   * This will make it possible to override the default behaviour.
   */
  templates?: typeof defaultTemplates
  /**
   * This will make it possible to override the default behaviour.
   */
  imports?: typeof MutationImports.templates
}

Mutation.File = function({ templates = defaultTemplates, imports = MutationImports.templates }: FileProps): ReactNode {
  const { key: pluginKey, options } = usePlugin<PluginOptions>()
  const pluginManager = usePluginManager()
  const schemas = useSchemas()
  const operation = useOperation()
  const file = useResolve({ pluginKey, type: 'file' })
  const fileType = useResolveType({ type: 'file' })

  const { clientImportPath, client, templatesPath, framework } = options
  const root = path.resolve(pluginManager.config.root, pluginManager.config.output.path)
  const clientPath = client ? path.resolve(root, 'client.ts') : undefined
  const resolvedClientPath = clientImportPath ? clientImportPath : clientPath ? getRelativePath(file.path, clientPath) : '@kubb/swagger-client/client'

  const importNames = getImportNames()
  const Template = templates[framework]
  const Import = imports[framework]

  return (
    <>
      <File override baseName={'types.ts'} path={path.resolve(file.path, '../types.ts')}>
        <File.Import name={'client'} path={resolvedClientPath} />
        <File.Source path={path.resolve(templatesPath, './types.ts')} print removeComments />
      </File>
      <File<FileMeta>
        baseName={file.baseName}
        path={file.path}
        meta={{
          pluginKey,
          // needed for the `output.groupBy`
          tag: operation?.getTags()[0]?.name,
        }}
      >
        <File.Import root={file.path} path={path.resolve(file.path, '../types.ts')} name={['KubbQueryFactory']} isTypeOnly />

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
        <MutationImports Template={Import} />
        <File.Source>
          <Mutation
            Template={Template}
            hookName={importNames.mutation[framework].hookName}
            resultType={importNames.mutation[framework].resultType}
            optionsType={importNames.mutation[framework].optionsType}
          />
        </File.Source>
      </File>
    </>
  )
}

Mutation.templates = defaultTemplates
