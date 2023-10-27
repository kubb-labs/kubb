/* eslint- @typescript-eslint/explicit-module-boundary-types */
import { FunctionParams, transformers, URLPath } from '@kubb/core/utils'
import { createRoot } from '@kubb/react'
import { File } from '@kubb/react'
import { OasBuilder } from '@kubb/swagger'
import { useResolve } from '@kubb/swagger/hooks'
import { getASTParams, getComments } from '@kubb/swagger/utils'

import { camelCase } from 'change-case'

import type { AppContextProps, RootType } from '@kubb/react'
import type { Resolver } from '@kubb/swagger'
import type { AppMeta, Options as PluginOptions } from '../types.ts'

type Options = {
  dataReturnType: PluginOptions['dataReturnType']
  errors: Resolver[]
  name: string
}

export class QueryBuilder extends OasBuilder<Options> {
  get #names() {
    const { operation } = this.context
    const { name } = this.options

    const queryKey = camelCase(`${operation.getOperationId()}QueryKey`)

    return {
      queryKey,
      queryOptions: camelCase(`${operation.getOperationId()}QueryOptions`),
      query: name,
      mutation: name,
    } as const
  }

  get queryOptions(): React.ElementType {
    const { errors, dataReturnType } = this.options
    const { operation, schemas } = this.context

    const generics = new FunctionParams()

    generics.add([
      { type: 'TData', default: schemas.response.name },
      { type: 'TError', default: errors.map((error) => error.name).join(' | ') || 'unknown' },
    ])

    const clientGenerics = ['TData', 'TError']
    const queryGenerics = [dataReturnType === 'data' ? 'TData' : 'ResponseConfig<TData>', 'TError']

    const Component = () => {
      const params = new FunctionParams()

      params.add([
        ...getASTParams(schemas.pathParams, { typed: true }),
        {
          name: 'params',
          type: schemas.queryParams?.name,
          enabled: !!schemas.queryParams?.name,
          required: false,
        },
        {
          name: 'headers',
          type: schemas.headerParams?.name,
          enabled: !!schemas.headerParams?.name,
          required: false,
        },
        {
          name: 'options',
          type: `Partial<Parameters<typeof client>[0]>`,
          default: '{}',
        },
      ])

      return (
        <>
          {`
  export function ${this.#names.queryOptions} <
    ${generics.toString()}
  >(
    ${params.toString()}
  ): SWRConfiguration<${queryGenerics.join(', ')}> {
    return {
      fetcher: () => {
        return client<${clientGenerics.join(', ')}>({
          method: "get",
          url: ${new URLPath(operation.path).template},
          ${schemas.request?.name ? 'data,' : ''}
          ${schemas.queryParams?.name ? 'params,' : ''}
          ${schemas.headerParams?.name ? 'headers: { ...headers, ...options.headers },' : ''}
          ...options,
        }).then(res => ${dataReturnType === 'data' ? 'res.data' : 'res'})
      },
    }
  }
  `}
        </>
      )
    }

    return Component
  }

  get query(): React.ElementType {
    const { name, errors, dataReturnType } = this.options
    const { operation, schemas } = this.context

    const comments = getComments(operation)

    const generics = new FunctionParams()

    const queryParams = new FunctionParams()

    generics.add([
      { type: 'TData', default: schemas.response.name },
      { type: 'TError', default: errors.map((error) => error.name).join(' | ') || 'unknown' },
    ])

    const clientGenerics = ['TData', 'TError']
    const queryGenerics = [dataReturnType === 'data' ? 'TData' : 'ResponseConfig<TData>', 'TError']

    queryParams.add([
      ...getASTParams(schemas.pathParams, { typed: false }),
      {
        name: 'params',
        enabled: !!schemas.queryParams?.name,
        required: false,
      },
      {
        name: 'headers',
        enabled: !!schemas.headerParams?.name,
        required: false,
      },
      {
        name: 'clientOptions',
        required: false,
      },
    ])

    const Component = () => {
      const params = new FunctionParams()
      const queryOptions = `${this.#names.queryKey}<${clientGenerics.join(', ')}>(${queryParams.toString()})`

      params.add([
        ...getASTParams(schemas.pathParams, { typed: true }),
        {
          name: 'params',
          type: schemas.queryParams?.name,
          enabled: !!schemas.queryParams?.name,
          required: false,
        },
        {
          name: 'headers',
          type: schemas.headerParams?.name,
          enabled: !!schemas.headerParams?.name,
          required: false,
        },
        {
          name: 'options',
          required: false,
          type: `{
            query?: SWRConfiguration<${queryGenerics.join(', ')}>,
            client?: Partial<Parameters<typeof client<${clientGenerics.filter((generic) => generic !== 'unknown').join(', ')}>>[0]>,
            shouldFetch?: boolean,
          }`,
          default: '{}',
        },
      ])

      return (
        <>
          {transformers.JSDoc.createJSDocBlockText({ comments })}
          {`
    export function ${name} <${generics.toString()}>(${params.toString()}): SWRResponse<${queryGenerics.join(', ')}> {
      const { query: queryOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}

      const url = shouldFetch ? ${new URLPath(operation.path).template} : null
      const query = useSWR<${queryGenerics.join(', ')}, string | null>(url, {
        ...${queryOptions},
        ...queryOptions
      })

      return query
    }
    `}
        </>
      )
    }
    return Component
  }

  get mutation(): React.ElementType {
    const { errors } = this.options
    const { operation, schemas } = this.context

    const comments = getComments(operation)

    const generics = new FunctionParams()

    generics.add([
      { type: 'TData', default: schemas.response.name },
      { type: 'TError', default: errors.map((error) => error.name).join(' | ') || 'unknown' },
      { type: 'TVariables', default: schemas.request?.name, enabled: !!schemas.request?.name },
    ])

    const clientGenerics = ['TData', 'TError', schemas.request?.name ? `TVariables` : undefined].filter(Boolean)
    const mutationGenerics = ['ResponseConfig<TData>', 'TError', 'string | null', schemas.request?.name ? `TVariables` : 'never'].filter(Boolean)

    const Component = () => {
      const params = new FunctionParams()
      const name = this.#names.mutation

      params.add([
        ...getASTParams(schemas.pathParams, { typed: true }),
        {
          name: 'params',
          type: schemas.queryParams?.name,
          enabled: !!schemas.queryParams?.name,
          required: false,
        },
        {
          name: 'headers',
          type: schemas.headerParams?.name,
          enabled: !!schemas.headerParams?.name,
          required: false,
        },
        {
          name: 'options',
          required: false,
          type: `{
            mutation?: SWRMutationConfiguration<${mutationGenerics.join(', ')}>,
            client?: Partial<Parameters<typeof client<${clientGenerics.filter((generic) => generic !== 'unknown').join(', ')}>>[0]>,
            shouldFetch?: boolean,
          }`,
          default: '{}',
        },
      ])

      return (
        <>
          {transformers.JSDoc.createJSDocBlockText({ comments })}
          {`
export function ${name} <
  ${generics.toString()}
>(
  ${params.toString()}
): SWRMutationResponse<${mutationGenerics.join(', ')}> {
  const { mutation: mutationOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}

  const url = shouldFetch ? ${new URLPath(operation.path).template} : null
  return useSWRMutation<${mutationGenerics.join(', ')}>(
    url,
    (url${schemas.request?.name ? ', { arg: data }' : ''}) => {
      return client<${clientGenerics.join(', ')}>({
        method: "${operation.method}",
        url,
        ${schemas.request?.name ? 'data,' : ''}
        ${schemas.queryParams?.name ? 'params,' : ''}
        ${schemas.headerParams?.name ? 'headers: { ...headers, ...clientOptions.headers },' : ''}
        ...clientOptions,
      })
    },
    mutationOptions
  )
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
    const { pluginManager, operation, schemas, plugin } = this.context

    const QueryOptions = this.queryOptions
    const Query = this.query

    const Mutation = this.mutation

    const root = createRoot<AppContextProps<AppMeta>>()

    const ComponentQuery = () => {
      const file = useResolve({ name, pluginKey: plugin.key, type: 'file' })

      return (
        <File baseName={file.baseName} path={file.path}>
          <File.Source>
            <QueryOptions />
            <br />
            <Query />
          </File.Source>
        </File>
      )
    }

    const ComponentMutation = () => {
      const file = useResolve({ name, pluginKey: plugin.key, type: 'file' })

      return (
        <File baseName={file.baseName} path={file.path}>
          <File.Source>
            <Mutation />
          </File.Source>
        </File>
      )
    }

    if (type === 'query') {
      root.render(<ComponentQuery />, { meta: { pluginManager, schemas, operation } })
    }
    if (type === 'mutation') {
      root.render(<ComponentMutation />, { meta: { pluginManager, schemas, operation } })
    }

    return root
  }
}
