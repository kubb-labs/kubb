/* eslint-disable react/prop-types */
/* eslint- @typescript-eslint/explicit-module-boundary-types */
import path from 'node:path'

import { FunctionParams, transformers, URLPath } from '@kubb/core/utils'
import { createRoot, File } from '@kubb/react'
import { OasBuilder } from '@kubb/swagger'
import { useResolve } from '@kubb/swagger/hooks'
import { getASTParams, getComments, getParams } from '@kubb/swagger/utils'

import { camelCase, pascalCase } from 'change-case'
import { capitalCase, capitalCaseTransform } from 'change-case'

import { HelpersFile, QueryKeyFunction } from '../components/index.ts'

import type { AppContextProps, RootType } from '@kubb/react'
import type { Resolver } from '@kubb/swagger'
import type { AppMeta, Framework, FrameworkImports, PluginOptions } from '../types.ts'

type BaseOptions = {
  dataReturnType: PluginOptions['options']['dataReturnType']
  framework: Framework
  frameworkImports: FrameworkImports
  errors: Resolver[]
}

type QueryOptions = BaseOptions & {
  infinite?: PluginOptions['options']['infinite']
}

type MutationOptions = BaseOptions
type Options = QueryOptions | MutationOptions

export class QueryBuilder extends OasBuilder<Options, PluginOptions> {
  get #names() {
    const { operation } = this.context
    const { frameworkImports } = this.options

    const queryKey = camelCase(`${operation.getOperationId()}QueryKey`)

    return {
      queryKey,
      // queryKey but for types
      QueryKey: capitalCase(queryKey, { delimiter: '', transform: capitalCaseTransform }),
      queryFactoryType: pascalCase(operation.getOperationId()),
      queryOptions: camelCase(`${operation.getOperationId()}QueryOptions`),
      query: frameworkImports.getName(operation),
      mutation: frameworkImports.getName(operation),
      mutationFactoryType: pascalCase(operation.getOperationId()),
    } as const
  }

  get queryFactoryType(): React.ComponentType {
    const { dataReturnType, errors } = this.options
    const { schemas } = this.context

    const generics = [
      schemas.response.name,
      errors.map((error) => error.name).join(' | ') || 'never',
      schemas.request?.name || 'never',
      schemas.pathParams?.name || 'never',
      schemas.queryParams?.name || 'never',
      schemas.headerParams?.name || 'never',
      schemas.response.name,
      `{ dataReturnType: '${dataReturnType}'; type: 'query' }`,
    ] as [data: string, error: string, request: string, pathParams: string, queryParams: string, headerParams: string, response: string, options: string]

    const Component = () => <>{`type ${this.#names.queryFactoryType} = KubbQueryFactory<${generics.join(', ')}>`}</>

    return Component
  }

  get mutationFactoryType(): React.ComponentType {
    const { errors } = this.options
    const { schemas } = this.context

    const generics = [
      schemas.response.name,
      errors.map((error) => error.name).join(' | ') || 'never',
      schemas.request?.name || 'never',
      schemas.pathParams?.name || 'never',
      schemas.queryParams?.name || 'never',
      schemas.headerParams?.name || 'never',
      schemas.response.name,
      `{ dataReturnType: 'full'; type: 'mutation' }`,
    ] as [data: string, error: string, request: string, pathParams: string, queryParams: string, headerParams: string, response: string, options: string]

    const Component = () => <>{`type ${this.#names.mutationFactoryType} = KubbQueryFactory<${generics.join(', ')}>`}</>

    return Component
  }
  get queryKey(): React.ComponentType {
    const { framework } = this.options

    const FrameworkComponent = QueryKeyFunction[framework]

    const Component = () => <FrameworkComponent factoryTypeName={this.#names.queryFactoryType} name={this.#names.queryKey} typeName={this.#names.QueryKey} />

    return Component
  }

  get queryOptions(): React.ComponentType<{ infinite?: boolean }> {
    const { framework, frameworkImports, infinite: { queryParam = 'id', initialPageParam = 0 } = {} } = this.options as QueryOptions
    const { operation, schemas } = this.context

    const pathParams = getParams(schemas.pathParams, {
      override: framework === 'vue' ? (item) => ({ ...item, name: item.name ? `ref${pascalCase(item.name)}` : undefined }) : undefined,
    }).toString()

    const generics = new FunctionParams()
    const params = new FunctionParams()

    generics.add([
      { type: `TQueryFnData extends ${this.#names.queryFactoryType}['data']`, default: `${this.#names.queryFactoryType}["data"]` },
      { type: 'TError', default: `${this.#names.queryFactoryType}["error"]` },
      { type: 'TData', default: `${this.#names.queryFactoryType}["response"]` },
      { type: 'TQueryData', default: `${this.#names.queryFactoryType}["response"]` },
    ])

    const clientGenerics = ['TQueryFnData', 'TError']
    const queryOptionsGenerics = [`${this.#names.queryFactoryType}['unionResponse']`, 'TError', 'TData', 'TQueryData', this.#names.QueryKey]

    const paramsData = [
      ...getASTParams(schemas.pathParams, {
        typed: true,
        override: framework === 'vue'
          ? (item) => ({ ...item, name: item.name ? `ref${pascalCase(item.name)}` : undefined, type: `MaybeRef<${item.type}>` })
          : undefined,
      }),
      {
        name: framework === 'vue' ? 'refParams' : 'params',
        type: framework === 'vue' && schemas.queryParams?.name ? `MaybeRef<${schemas.queryParams?.name}>` : `${this.#names.queryFactoryType}['queryParams']`,
        enabled: !!schemas.queryParams?.name,
        required: !!schemas.queryParams?.schema.required?.length,
      },
      {
        name: framework === 'vue' ? 'refHeaders' : 'headers',
        type: framework === 'vue' && schemas.headerParams?.name ? `MaybeRef<${schemas.headerParams?.name}>` : schemas.headerParams?.name,
        enabled: !!schemas.headerParams?.name,
        required: !!schemas.headerParams?.schema.required?.length,
      },
      {
        name: 'options',
        type: `${this.#names.queryFactoryType}['client']['paramaters']`,
        default: '{}',
      },
    ]
    params.add(paramsData)

    const unrefs = framework === 'vue'
      ? paramsData
        .filter((item) => item.type?.startsWith('MaybeRef<'))
        .map((item) => {
          return item.name ? `const ${camelCase(item.name.replace('ref', ''))} = unref(${item.name})` : undefined
        })
        .join('\n')
      : ''

    const Component: React.FC<{ infinite?: boolean }> = ({ infinite }) => {
      let text = ''
      let name = this.#names.queryOptions

      let queryKey = `${this.#names.queryKey}(${schemas.pathParams?.name ? `${pathParams}, ` : ''}${schemas.queryParams?.name ? 'params' : ''})`

      if (framework === 'vue') {
        queryKey = `${this.#names.queryKey}(${schemas.pathParams?.name ? `${pathParams}, ` : ''}${schemas.queryParams?.name ? 'refParams' : ''})`
      }

      if (infinite) {
        name = `${name}Infinite`
      }

      if (frameworkImports.isV5 && frameworkImports.query.queryOptions) {
        // v5 with queryOptions
        text = `
       export function ${name} <${generics.toString()}>(${params.toString()}): ${frameworkImports.query.Options}<${queryOptionsGenerics.join(', ')}> {
         const queryKey = ${queryKey}

         return ${frameworkImports.query.queryOptions}<${queryOptionsGenerics.join(', ')}>({
           queryKey,
           queryFn: () => {
             ${unrefs}
             return client<${clientGenerics.join(', ')}>({
               method: "get",
               url: ${new URLPath(operation.path).template},
               ${schemas.queryParams?.name ? 'params,' : ''}
               ${schemas.headerParams?.name ? 'headers: { ...headers, ...options.headers },' : ''}
               ...options,
             }).then(res => res?.data || res)
           },
         })
       }
       `
      } else if (!frameworkImports.isV5 && infinite) {
        const pageParamText = ` ${
          schemas.queryParams?.name
            ? `params: {
                    ...params,
                    ['${queryParam}']: pageParam,
                    ...(options.params || {}),
                  }`
            : ''
        }`
        // infinite v4
        text = `
   export function ${name} <${generics.toString()}>(${params.toString()}): ${frameworkImports.queryInfinite.Options}<${queryOptionsGenerics.join(', ')}> {
     const queryKey = ${queryKey}

     return {
       queryKey,
       queryFn: ({ pageParam }) => {
         ${unrefs}
         return client<${clientGenerics.join(', ')}>({
           method: "get",
           url: ${new URLPath(operation.path).template},
           ${schemas.headerParams?.name ? 'headers: { ...headers, ...options.headers },' : ''}
           ...options,
           ${pageParamText}
         }).then(res => res?.data || res)
       },
     }
   }
   `
      } else if (frameworkImports.isV5 && infinite) {
        const pageParamText = ` ${
          schemas.queryParams?.name
            ? `params: {
              ...params,
              ['${queryParam}']: pageParam,
              ...(options.params || {}),
            }`
            : ''
        }`
        // infinite v5
        text = `
        export function ${name} <${generics.toString()}>(${params.toString()}): ${frameworkImports.queryInfinite.Options}<${queryOptionsGenerics.join(', ')}> {
          const queryKey = ${queryKey}

          return {
           queryKey,
           queryFn: ({ pageParam }) => {
             ${unrefs}
             return client<${clientGenerics.join(', ')}>({
               method: "get",
               url: ${new URLPath(operation.path).template},
               ${schemas.headerParams?.name ? 'headers: { ...headers, ...options.headers },' : ''}
               ...options,
               ${pageParamText}
              }).then(res => res?.data || res)
             },
             initialPageParam: ${initialPageParam || 'undefined'},
             getNextPageParam: (lastPage) => lastPage['${queryParam}'],
            }
          }
          `
      } else {
        // v4
        text = `
        export function ${name} <${generics.toString()}>(${params.toString()}): ${frameworkImports.query.Options}<${queryOptionsGenerics.join(', ')}> {
          const queryKey = ${queryKey}

          return {
            queryKey,
            queryFn: () => {
              ${unrefs}
              return client<${clientGenerics.join(', ')}>({
                method: "get",
                url: ${new URLPath(operation.path).template},
                ${schemas.queryParams?.name ? 'params,' : ''}
                ${schemas.headerParams?.name ? 'headers: { ...headers, ...options.headers },' : ''}
                ...options,
              }).then(res => res?.data || res)
            },
          }
        }
        `
      }

      return <>{text}</>
    }

    return Component
  }

  get query(): React.ComponentType<{ infinite?: boolean }> {
    const { framework, frameworkImports } = this.options
    const { operation, schemas } = this.context

    const pathParams = getParams(schemas.pathParams, {
      override: framework === 'vue' ? (item) => ({ ...item, name: item.name ? `ref${pascalCase(item.name)}` : undefined }) : undefined,
    }).toString()
    const comments = getComments(operation)

    const generics = new FunctionParams()

    const queryParams = new FunctionParams()

    generics.add([
      { type: `TQueryFnData extends ${this.#names.queryFactoryType}['data']`, default: `${this.#names.queryFactoryType}["data"]` },
      { type: 'TError', default: `${this.#names.queryFactoryType}["error"]` },
      { type: 'TData', default: `${this.#names.queryFactoryType}["response"]` },
      { type: 'TQueryData', default: `${this.#names.queryFactoryType}["response"]` },
      { type: `TQueryKey extends ${frameworkImports.query.QueryKey}`, default: this.#names.QueryKey },
    ])

    const resultGenerics = ['TData', 'TError']
    // TODO check why we need any for v5
    const useQueryGenerics = [frameworkImports.isV5 ? 'any' : 'TQueryFnData', 'TError', 'TData', 'any']
    const queryOptionsGenerics = ['TQueryFnData', 'TError', 'TData', 'TQueryData']
    // only neeed for the options to override the useQuery options/params
    const queryOptionsOverrideGenerics = ['TQueryFnData', 'TError', 'TData', 'TQueryData', 'TQueryKey']

    queryParams.add([
      ...getASTParams(schemas.pathParams, {
        typed: false,
        override: framework === 'vue' ? (item) => ({ ...item, name: item.name ? `ref${pascalCase(item.name)}` : undefined }) : undefined,
      }),
      {
        name: framework === 'vue' ? 'refParams' : 'params',
        enabled: !!schemas.queryParams?.name,
        required: !!schemas.queryParams?.schema.required?.length,
      },
      {
        name: framework === 'vue' ? 'refHeaders' : 'headers',
        enabled: !!schemas.headerParams?.name,
        required: !!schemas.headerParams?.schema.required?.length,
      },
      {
        name: 'clientOptions',
        required: false,
      },
    ])

    const Component: React.FC<{ infinite?: boolean }> = ({ infinite }) => {
      const params = new FunctionParams()

      let name = this.#names.query
      let hookName = frameworkImports.query.hook
      let QueryResult = frameworkImports.query.Result
      let QueryOptions = frameworkImports.query.Options

      const queryKey = `${this.#names.queryKey}(${schemas.pathParams?.name ? `${pathParams}, ` : ''}${
        schemas.queryParams?.name ? (framework === 'vue' ? 'refParams' : 'params') : ''
      })`
      let queryOptions = `${this.#names.queryOptions}<${queryOptionsGenerics.join(', ')}>(${queryParams.toString()})`

      if (infinite) {
        queryOptions = `${this.#names.queryOptions}Infinite<${queryOptionsGenerics.join(', ')}>(${queryParams.toString()})`
        name = `${name}Infinite`
        hookName = frameworkImports.queryInfinite.hook
        QueryResult = frameworkImports.queryInfinite.Result
        QueryOptions = frameworkImports.queryInfinite.Options
      }

      params.add([
        ...getASTParams(schemas.pathParams, {
          typed: true,
          override: framework === 'vue'
            ? (item) => ({ ...item, name: item.name ? `ref${pascalCase(item.name)}` : undefined, type: `MaybeRef<${item.type}>` })
            : undefined,
        }),
        {
          name: framework === 'vue' ? 'refParams' : 'params',
          type: framework === 'vue' && schemas.queryParams?.name ? `MaybeRef<${schemas.queryParams?.name}>` : `${this.#names.queryFactoryType}['queryParams']`,
          enabled: !!schemas.queryParams?.name,
          required: !!schemas.queryParams?.schema.required?.length,
        },
        // TODO add headerparams
        {
          name: framework === 'vue' ? 'refHeaders' : 'headers',
          type: framework === 'vue' && schemas.headerParams?.name ? `MaybeRef<${schemas.headerParams?.name}>` : schemas.headerParams?.name,
          enabled: !!schemas.headerParams?.name,
          required: !!schemas.headerParams?.schema.required?.length,
        },
        {
          name: 'options',
          type: `{
            query?: ${QueryOptions}<${queryOptionsOverrideGenerics.join(', ')}>,
            client?: ${this.#names.queryFactoryType}['client']['paramaters']
          }`,
          default: '{}',
        },
      ])

      return (
        <>
          {transformers.JSDoc.createJSDocBlockText({ comments })}
          {`
export function ${name} <${generics.toString()}>(${params.toString()}): ${QueryResult}<${
            resultGenerics.join(
              ', ',
            )
          }> & { queryKey: TQueryKey } {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? ${queryKey}

  const query = ${hookName}<${useQueryGenerics.join(', ')}>({
    ...${queryOptions},
    ${framework === 'solid' ? 'queryKey: () => queryKey' : 'queryKey'},
    ...queryOptions
  }) as ${QueryResult}<${resultGenerics.join(', ')}> & { queryKey: TQueryKey }

  query.queryKey = queryKey as TQueryKey

  return query
}
`}
        </>
      )
    }

    return Component
  }

  get mutation(): React.ComponentType {
    const { framework, frameworkImports } = this.options as MutationOptions
    const { operation, schemas } = this.context

    const comments = getComments(operation)

    const generics = new FunctionParams()
    const params = new FunctionParams()

    generics.add([
      { type: 'TData', default: `${this.#names.mutationFactoryType}["response"]` },
      { type: 'TError', default: `${this.#names.mutationFactoryType}["error"]` },
    ])

    const clientGenerics = [
      `${this.#names.mutationFactoryType}["data"]`,
      'TError',
      schemas.request?.name ? `${this.#names.mutationFactoryType}["request"]` : 'void',
      framework === 'vue' ? 'unknown' : undefined,
    ].filter(Boolean)
    const resultGenerics = [
      'TData',
      'TError',
      schemas.request?.name ? `${this.#names.mutationFactoryType}["request"]` : 'void',
      framework === 'vue' ? 'unknown' : undefined,
    ].filter(Boolean)

    // only neeed for the options to override the useMutation options/params
    const mutationOptionsOverrideGenerics = [
      'TData',
      'TError',
      schemas.request?.name ? `${this.#names.mutationFactoryType}["request"]` : 'void',
      framework === 'vue' ? 'unknown' : undefined,
    ].filter(Boolean)

    const paramsData = [
      ...getASTParams(schemas.pathParams, {
        typed: true,
        override: framework === 'vue'
          ? (item) => ({ ...item, name: item.name ? `ref${pascalCase(item.name)}` : undefined, type: `MaybeRef<${item.type}>` })
          : undefined,
      }),
      {
        name: framework === 'vue' ? 'refParams' : 'params',
        type: framework === 'vue' && schemas.queryParams?.name ? `MaybeRef<${schemas.queryParams?.name}>` : `${this.#names.mutationFactoryType}['queryParams']`,
        enabled: !!schemas.queryParams?.name,
        required: !!schemas.queryParams?.schema.required?.length,
      },
      // TODO add headerparams
      {
        name: framework === 'vue' ? 'refHeaders' : 'headers',
        type: framework === 'vue' && schemas.headerParams?.name ? `MaybeRef<${schemas.headerParams?.name}>` : schemas.headerParams?.name,
        enabled: !!schemas.headerParams?.name,
        required: !!schemas.headerParams?.schema.required?.length,
      },
      {
        name: 'options',
        type: `{
          mutation?: ${frameworkImports.mutate.Options}<${mutationOptionsOverrideGenerics.join(', ')}>,
          client?: ${this.#names.mutationFactoryType}['client']['paramaters']
      }`,
        default: '{}',
      },
    ]
    params.add(paramsData)

    const unrefs = framework === 'vue'
      ? paramsData
        .filter((item) => item.type?.startsWith('MaybeRef<'))
        .map((item) => {
          return item.name ? `const ${camelCase(item.name.replace('ref', ''))} = unref(${item.name})` : undefined
        })
        .join('\n')
      : ''

    const Component = () => {
      const name = this.#names.mutation

      return (
        <>
          {transformers.JSDoc.createJSDocBlockText({ comments })}
          {`
export function ${name} <${generics.toString()}>(${params.toString()}): ${frameworkImports.mutate.Result}<${resultGenerics.join(', ')}> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}

  return ${frameworkImports.mutate.hook}<${resultGenerics.join(', ')}>({
    mutationFn: (${schemas.request?.name ? 'data' : ''}) => {
      ${unrefs}
      return client<${clientGenerics.filter((generic) => generic !== 'unknown').join(', ')}>({
        method: "${operation.method}",
        url: ${new URLPath(operation.path).template},
        ${schemas.request?.name ? 'data,' : ''}
        ${schemas.queryParams?.name ? 'params,' : ''}
        ${schemas.headerParams?.name ? 'headers: { ...headers, ...clientOptions.headers },' : ''}
        ...clientOptions
      }).then(res => res as TData)
    },
    ...mutationOptions
  })
}
`}
        </>
      )
    }

    return Component
  }

  print(type: 'query' | 'mutation', name: string): string {
    return this.render(type, name).output
  }

  render(type: 'query' | 'mutation', name: string): RootType<AppContextProps<AppMeta>> {
    const { infinite } = this.options as QueryOptions
    const { pluginManager, operation, schemas, plugin } = this.context

    const QueryKey = this.queryKey
    const QueryType = this.queryFactoryType
    const MutationType = this.mutationFactoryType
    const QueryOptions = this.queryOptions
    const Query = this.query

    const Mutation = this.mutation

    const root = createRoot<AppContextProps<AppMeta>>()

    const ComponentQuery = () => {
      const file = useResolve({ name, pluginKey: plugin.key, type: 'file' })

      return (
        <>
          <HelpersFile id={'types'} path={path.resolve(file.path, '../types.ts')} />
          <File id={name} baseName={file.baseName} path={file.path}>
            <File.Import root={file.path} path={path.resolve(file.path, '../types.ts')} name={['KubbQueryFactory']} isTypeOnly />
            <File.Source>
              <QueryType />
              <QueryKey />
              <QueryOptions infinite={false} />
              <Query />
              <br />
              {infinite && <QueryOptions infinite />}
              {infinite && <Query infinite />}
              <br />
            </File.Source>
          </File>
        </>
      )
    }

    const ComponentMutation = () => {
      const file = useResolve({ name, pluginKey: plugin.key, type: 'file' })

      return (
        <>
          <HelpersFile id={'types'} path={path.resolve(file.path, '../types.ts')} />
          <File id={name} baseName={file.baseName} path={file.path}>
            <File.Import root={file.path} path={path.resolve(file.path, '../types.ts')} name={['KubbQueryFactory']} isTypeOnly />
            <File.Source>
              <MutationType />
              <Mutation />
            </File.Source>
          </File>
        </>
      )
    }

    if (type === 'query') {
      root.render(<ComponentQuery />, { meta: { pluginManager, plugin, schemas, operation } })
    }
    if (type === 'mutation') {
      root.render(<ComponentMutation />, { meta: { pluginManager, plugin, schemas, operation } })
    }

    return root
  }
}
