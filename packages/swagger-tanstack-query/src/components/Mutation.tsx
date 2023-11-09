import path from 'node:path'

import { PackageManager } from '@kubb/core'
import { FunctionParams, getRelativePath, transformers, URLPath } from '@kubb/core/utils'
import { File, Function, Type, usePlugin, usePluginManager } from '@kubb/react'
import { useOperation, useResolve, useSchemas } from '@kubb/swagger/hooks'
import { getASTParams, getComments } from '@kubb/swagger/utils'
import { useResolve as useResolveType } from '@kubb/swagger-ts/hooks'

import { camelCase, pascalCase } from 'change-case'

import { MutationImports } from './MutationImports.tsx'

import type { HttpMethod, OperationSchemas } from '@kubb/swagger'
import type { ReactNode } from 'react'
import type { FileMeta, Framework, PluginOptions } from '../types.ts'

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
  isV5: boolean
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
  const clientParams = [
    `method: "${client.method}"`,
    `url: ${client.path.template}`,
    client.withQueryParams ? 'params' : undefined,
    client.withData ? 'data' : undefined,
    client.withHeaders ? 'headers: { ...headers, ...clientOptions.headers }' : undefined,
    '...clientOptions',
  ].filter(Boolean)

  const clientOptions = `${transformers.createIndent(4)}${clientParams.join(`,\n${transformers.createIndent(4)}`)}`

  return (
    <Function export name={name} generics={generics} returnType={returnType} params={params} JSDoc={JSDoc}>
      {`
       const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}

       return ${hook.name}<${hook.generics}>({
         mutationFn: (${client.withData ? 'data' : ''}) => {
          ${hook.children || ''}
           return client<${client.generics}>({
            ${clientOptions}
           }).then(res => res as TData)
         },
         ...mutationOptions
       })`}
    </Function>
  )
}

type FrameworkTemplateProps = Omit<TemplateProps, 'returnType' | 'client' | 'hook' | 'params'> & {
  optionsType?: string
  resultType?: string
  hook?: Pick<TemplateProps['hook'], 'name'>
  client: Omit<TemplateProps['client'], 'generics'>
  schemas: OperationSchemas
  factory: {
    name: string
    generics: [data: string, error: string, request: string, pathParams: string, queryParams: string, headerParams: string, response: string, options: string]
  }
  /**
   * This will make it possible to override the default behaviour.
   */
  Template?: React.ComponentType<React.ComponentProps<typeof Template>>
}

const defaultTemplates = {
  get default() {
    return function(
      {
        resultType,
        optionsType,
        schemas,
        client,
        hook,
        factory,
        Template: MutationTemplate = Template,
        ...rest
      }: FrameworkTemplateProps,
    ): ReactNode {
      if (!hook?.name || !resultType || !optionsType) {
        throw new Error('Could not find a hookname')
      }

      const params = new FunctionParams()

      const clientGenerics = [
        `${factory.name}["data"]`,
        'TError',
        client.withData ? `${factory.name}["request"]` : 'void',
      ]

      const hookGenerics = [
        'TData',
        'TError',
        client.withData ? `${factory.name}["request"]` : 'void',
      ]

      const resultGenerics = [
        'TData',
        'TError',
        client.withData ? `${factory.name}["request"]` : 'void',
      ]

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
          <MutationTemplate
            {...rest}
            params={params.toString()}
            returnType={`${resultType}<${resultGenerics.join(', ')}>`}
            client={{
              ...client,
              generics: clientGenerics.toString(),
            }}
            hook={{
              ...hook,
              generics: hookGenerics.join(', '),
            }}
          />
        </>
      )
    }
  },
  get react() {
    const Component = this.default

    return function(props: FrameworkTemplateProps): ReactNode {
      return (
        <Component
          {...props}
          hook={{
            name: 'useMutation',
          }}
          resultType="UseMutationResult"
          optionsType="UseMutationOptions"
        />
      )
    }
  },
  get solid() {
    const Component = this.default

    return function(props: FrameworkTemplateProps): ReactNode {
      return (
        <Component
          {...props}
          hook={{
            name: 'createMutation',
          }}
          resultType="CreateMutationResult"
          optionsType="CreateMutationOptions"
        />
      )
    }
  },
  get svelte() {
    const Component = this.default

    return function(props: FrameworkTemplateProps): ReactNode {
      return (
        <Component
          {...props}
          hook={{
            name: 'createMutation',
          }}
          resultType="CreateMutationResult"
          optionsType="CreateMutationOptions"
        />
      )
    }
  },
  get vue() {
    return function({ isV5, schemas, client, hook, factory, Template: MutationTemplate = Template, ...rest }: FrameworkTemplateProps): ReactNode {
      const hookName = 'useMutation'
      const resultType = 'UseMutationReturnType'
      const optionsType = isV5 ? 'UseMutationOptions' : 'VueMutationObserverOptions'
      const params = new FunctionParams()

      const clientGenerics = [
        `${factory.name}["data"]`,
        'TError',
        client.withData ? `${factory.name}["request"]` : 'void',
      ]

      const hookGenerics = [
        'TData',
        'TError',
        client.withData ? `${factory.name}["request"]` : 'void',
        'unknown',
      ]

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

      return (
        <>
          <Type name={factory.name}>
            {`KubbQueryFactory<${factory.generics.join(', ')}>`}
          </Type>
          <MutationTemplate
            {...rest}
            isV5={isV5}
            params={params.toString()}
            returnType={`${resultType}<${resultGenerics.join(', ')}>`}
            client={{
              ...client,
              generics: clientGenerics.toString(),
            }}
            hook={{
              ...hook,
              name: hookName,
              generics: hookGenerics.join(', '),
              children: unrefs,
            }}
          />
        </>
      )
    }
  },
} as const

type Props = {
  /**
   * This will make it possible to override the default behaviour.
   */
  Template?: React.ComponentType<FrameworkTemplateProps>
}

export function Mutation({
  Template = defaultTemplates.react,
}: Props): ReactNode {
  const { key: pluginKey, options } = usePlugin<PluginOptions>()
  const operation = useOperation()
  const { name } = useResolve({
    pluginKey,
    type: 'function',
  })
  const schemas = useSchemas()

  const factory: FrameworkTemplateProps['factory'] = {
    name: pascalCase(operation.getOperationId()),
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
  const isV5 = new PackageManager().isValidSync(/@tanstack/, '>=5')

  generics.add([
    { type: 'TData', default: `${factory.name}["response"]` },
    { type: 'TError', default: `${factory.name}["error"]` },
  ])

  return (
    <Template
      isV5={isV5}
      name={name}
      schemas={schemas}
      generics={generics.toString()}
      factory={factory}
      JSDoc={{ comments: getComments(operation) }}
      client={{
        withQueryParams: !!schemas.queryParams?.name,
        withData: !!schemas.request?.name,
        withPathParams: !!schemas.pathParams?.name,
        withHeaders: !!schemas.headerParams?.name,
        method: operation.method,
        path: new URLPath(operation.path),
      }}
    />
  )
}

type FileProps = {
  framework: Framework
  /**
   * This will make it possible to override the default behaviour.
   */
  templates?: typeof defaultTemplates
  /**
   * This will make it possible to override the default behaviour.
   */
  imports?: typeof MutationImports.templates
}

Mutation.File = function({ framework, templates = defaultTemplates, imports = MutationImports.templates }: FileProps): ReactNode {
  const { key: pluginKey, options } = usePlugin<PluginOptions>()
  const pluginManager = usePluginManager()
  const schemas = useSchemas()
  const operation = useOperation()
  const file = useResolve({ pluginKey, type: 'file' })
  const fileType = useResolveType({ type: 'file' })

  const { clientImportPath, client, templatesPath } = options
  const root = path.resolve(pluginManager.config.root, pluginManager.config.output.path)
  const clientPath = client ? path.resolve(root, 'client.ts') : undefined
  const resolvedClientPath = clientImportPath ? clientImportPath : clientPath ? getRelativePath(file.path, clientPath) : '@kubb/swagger-client/client'

  const Template = templates[framework]
  const Import = imports[framework]
  const isV5 = new PackageManager().isValidSync(/@tanstack/, '>=5')

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
        <Import isV5={isV5} />
        <File.Source>
          <Mutation Template={Template} />
        </File.Source>
      </File>
    </>
  )
}

Mutation.templates = defaultTemplates
