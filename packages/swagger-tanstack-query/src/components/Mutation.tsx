import path from 'node:path'

import { PackageManager } from '@kubb/core'
import { FunctionParams, getRelativePath, transformers, URLPath } from '@kubb/core/utils'
import { File, Function, Type, usePlugin, usePluginManager } from '@kubb/react'
import { useOperation, useResolve, useSchemas } from '@kubb/swagger/hooks'
import { getASTParams, getComments } from '@kubb/swagger/utils'
import { useResolve as useResolveType } from '@kubb/swagger-ts/hooks'

import { camelCase, pascalCase } from 'change-case'

import type { HttpMethod, OperationSchemas } from '@kubb/swagger'
import type { ReactNode } from 'react'
import type { FileMeta, Framework, PluginOptions } from '../types.ts'

type MutationTemplateProps = {
  name: string
  params: string
  generics?: string
  returnType: string
  comments: string[]

  // props Mutation
  hookName: string
  hookGenerics: string
  clientGenerics: string
  method: HttpMethod
  withQueryParams: boolean
  withPathParams: boolean
  withData: boolean
  withHeaders: boolean
  path: URLPath
  isV5: boolean

  children?: string
}

Mutation.Template = function({
  name,
  hookName,
  generics,
  returnType,
  params,
  comments,
  clientGenerics,
  method,
  path,
  withData,
  withHeaders,
  withQueryParams,
  hookGenerics,
  children,
}: MutationTemplateProps): ReactNode {
  const clientParams = [
    `method: "${method}"`,
    `url: ${path.template}`,
    withQueryParams ? 'params' : undefined,
    withData ? 'data' : undefined,
    withHeaders ? 'headers: { ...headers, ...clientOptions.headers }' : undefined,
    '...clientOptions',
  ].filter(Boolean)

  return (
    <Function name={name} export generics={generics} returnType={returnType} params={params} JSDoc={{ comments }}>
      {`
       const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}

       return ${hookName}<${hookGenerics}>({
         mutationFn: (${withData ? 'data' : ''}) => {
          ${children || ''}
           return client<${clientGenerics}>({
            ${transformers.createIndent(4)}${clientParams.join(`,\n${transformers.createIndent(4)}`)}
           }).then(res => res as TData)
         },
         ...mutationOptions
       })`}
    </Function>
  )
}

type MutationTemplateFrameworkProps = Omit<MutationTemplateProps, 'returnType' | 'hookName' | 'params' | 'clientGenerics' | 'hookGenerics'> & {
  optionsType?: string
  resultType?: string
  hookName?: string
  schemas: OperationSchemas
  factory: {
    name: string
    Generics: [data: string, error: string, request: string, pathParams: string, queryParams: string, headerParams: string, response: string, options: string]
  }
}

const defaultTemplates = {
  get default() {
    return function(
      { hookName, resultType, optionsType, schemas, withData, withPathParams, withHeaders, withQueryParams, factory, ...rest }: MutationTemplateFrameworkProps,
    ): ReactNode {
      if (!hookName || !resultType || !optionsType) {
        return null
      }

      const params = new FunctionParams()

      const clientGenerics = [
        `${factory.name}["data"]`,
        'TError',
        withData ? `${factory.name}["request"]` : 'void',
      ]

      const hookGenerics = [
        'TData',
        'TError',
        withData ? `${factory.name}["request"]` : 'void',
      ]

      const resultGenerics = [
        'TData',
        'TError',
        withData ? `${factory.name}["request"]` : 'void',
      ]

      params.add([
        ...getASTParams(schemas.pathParams, {
          typed: true,
        }),
        {
          name: 'params',
          type: `${factory.name}['queryParams']`,
          enabled: withQueryParams,
          required: !!schemas.queryParams?.schema.required?.length,
        },
        {
          name: 'headers',
          type: `${factory.name}['headerParams']`,
          enabled: withHeaders,
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
            {`KubbQueryFactory<${factory.Generics.join(', ')}>`}
          </Type>
          <Mutation.Template
            {...rest}
            params={params.toString()}
            clientGenerics={clientGenerics.toString()}
            hookGenerics={hookGenerics.join(', ')}
            withData={withData}
            withHeaders={withHeaders}
            withPathParams={withPathParams}
            withQueryParams={withQueryParams}
            hookName={hookName}
            returnType={`${resultType}<${resultGenerics.join(', ')}`}
          />
        </>
      )
    }
  },
  get react() {
    return this.default
  },
  get solid() {
    const Component = this.default

    return function(props: MutationTemplateFrameworkProps): ReactNode {
      return (
        <Component
          {...props}
          hookName="createMutation"
          resultType="CreateMutationResult"
          optionsType="CreateMutationOptions"
        />
      )
    }
  },
  get svelte() {
    const Component = this.solid

    return function(props: MutationTemplateFrameworkProps): ReactNode {
      return (
        <Component
          {...props}
        />
      )
    }
  },
  get vue() {
    return function({ isV5, schemas, withHeaders, withPathParams, withQueryParams, withData, factory, ...rest }: MutationTemplateFrameworkProps): ReactNode {
      const hookName = 'useMutation'
      const resultType = 'UseMutationReturnType'
      const optionsType = isV5 ? 'UseMutationOptions' : 'VueMutationObserverOptions'
      const params = new FunctionParams()

      const clientGenerics = [
        `${factory.name}["data"]`,
        'TError',
        withData ? `${factory.name}["request"]` : 'void',
      ]

      const hookGenerics = [
        'TData',
        'TError',
        withData ? `${factory.name}["request"]` : 'void',
        'unknown',
      ]

      const resultGenerics = [
        'TData',
        'TError',
        withData ? `${factory.name}["request"]` : 'void',
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
          enabled: withQueryParams,
          required: !!schemas.queryParams?.schema.required?.length,
        },
        {
          name: 'refHeaders',
          type: `MaybeRef<${schemas.headerParams?.name}>`,
          enabled: withHeaders,
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
            {`KubbQueryFactory<${factory.Generics.join(', ')}>`}
          </Type>
          <Mutation.Template
            {...rest}
            isV5={isV5}
            params={params.toString()}
            clientGenerics={clientGenerics.toString()}
            hookGenerics={hookGenerics.join(', ')}
            withData={withData}
            withHeaders={withHeaders}
            withPathParams={withPathParams}
            withQueryParams={withQueryParams}
            hookName={hookName}
            returnType={`${resultType}<${resultGenerics.join(', ')}`}
          >
            {unrefs}
          </Mutation.Template>
        </>
      )
    }
  },
} as const

type MutationImportFrameworkProps = {
  isV5?: boolean
  path?: string
  optionsType?: string
  resultType?: string
  hookName?: string
}

const defaultImports = {
  get default() {
    return function({ path, optionsType, resultType, hookName }: MutationImportFrameworkProps): ReactNode {
      if (!path || !optionsType || !resultType || !hookName) {
        return null
      }

      return (
        <>
          <File.Import name={[optionsType, resultType]} path={path} isTypeOnly />
          <File.Import name={[hookName]} path={path} />
        </>
      )
    }
  },
  get react() {
    const Component = this.default

    return function(props: MutationImportFrameworkProps): ReactNode {
      return (
        <Component
          {...props}
          isV5={props.isV5 || false}
          path={'@tanstack/react-query'}
          hookName={'useMutation'}
          optionsType={'UseMutationOptions'}
          resultType={'UseMutationResult'}
        />
      )
    }
  },
  get solid() {
    const Component = this.default

    return function(props: MutationImportFrameworkProps): ReactNode {
      return (
        <Component
          {...props}
          isV5={props.isV5 || false}
          path={'@tanstack/solid-query'}
          hookName={'createMutation'}
          optionsType={'CreateMutationOptions'}
          resultType={'CreateMutationResult'}
        />
      )
    }
  },
  get svelte() {
    const Component = this.solid

    return function(props: MutationImportFrameworkProps): ReactNode {
      return (
        <Component
          {...props}
          path={'@tanstack/svelte-query'}
        />
      )
    }
  },
  get vue() {
    return function({ isV5, path = '@tanstack/vue-query' }: MutationImportFrameworkProps): ReactNode {
      return (
        <>
          {isV5 && <File.Import name={['UseMutationOptions', 'UseMutationReturnType']} path={path} isTypeOnly />}

          {!isV5 && <File.Import name={['UseMutationReturnType']} path={path} isTypeOnly />}
          {!isV5 && <File.Import name={['VueMutationObserverOptions']} path={'@tanstack/vue-query/build/lib/useMutation'} isTypeOnly />}
          <File.Import name={['useMutation']} path={path} />
          <File.Import name={['unref']} path={'vue'} />
          <File.Import name={['MaybeRef']} path={'vue'} isTypeOnly />
        </>
      )
    }
  },
} as const

type MutationFileProps = {
  framework: Framework
  /**
   * Will make it possible to override the default behaviour of Mock.Template
   */
  templates?: typeof defaultTemplates
  imports?: typeof defaultImports
}

Mutation.File = function({ framework, templates = defaultTemplates, imports = defaultImports }: MutationFileProps): ReactNode {
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
        {/** for HelpersFile, TODO add to operationGenerator */}
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

type MutationProps = {
  Template?: React.ComponentType<MutationTemplateFrameworkProps>
}

export function Mutation({
  Template = defaultTemplates.react,
}: MutationProps): ReactNode {
  const { key: pluginKey } = usePlugin<PluginOptions>()
  const operation = useOperation()
  const { name } = useResolve({
    pluginKey,
    type: 'function',
  })
  const schemas = useSchemas()

  const factory: MutationTemplateFrameworkProps['factory'] = {
    name: pascalCase(operation.getOperationId()),
    Generics: [
      schemas.response.name,
      schemas.errors?.map((error) => error.name).join(' | ') || 'never',
      schemas.request?.name || 'never',
      schemas.pathParams?.name || 'never',
      schemas.queryParams?.name || 'never',
      schemas.headerParams?.name || 'never',
      schemas.response.name,
      `{ dataReturnType: 'full'; type: 'mutation' }`,
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
      path={new URLPath(operation.path)}
      withQueryParams={!!schemas.queryParams?.name}
      withPathParams={!!schemas.pathParams?.name}
      withData={!!schemas.request?.name}
      withHeaders={!!schemas.headerParams?.name}
      factory={factory}
      comments={getComments(operation)}
      method={operation.method}
    />
  )
}
