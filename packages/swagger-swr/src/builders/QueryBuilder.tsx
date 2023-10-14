/* eslint- @typescript-eslint/explicit-module-boundary-types */
import { combineCodes, createFunctionParams, createJSDocBlockText, FunctionParams, URLPath } from '@kubb/core'
import { createRoot, File } from '@kubb/react'
import { getASTParams, getComments, OasBuilder, useResolve } from '@kubb/swagger'

import { camelCase } from 'change-case'

import { pluginName } from '../plugin.ts'

import type { PluginManager } from '@kubb/core'
import type { AppContextProps, RootType } from '@kubb/react'
import type { Operation, OperationSchemas, Resolver } from '@kubb/swagger'
import type { AppMeta, Options as PluginOptions } from '../types.ts'

type Config = {
  pluginManager: PluginManager
  dataReturnType: PluginOptions['dataReturnType']
  operation: Operation
  schemas: OperationSchemas
  errors: Resolver[]
  name: string
}

type QueryResult = { code: string; name: string }

export class QueryBuilder extends OasBuilder<Config> {
  private get queryOptions(): QueryResult {
    const { operation, schemas, errors, dataReturnType } = this.config
    const codes: string[] = []

    const name = camelCase(`${operation.getOperationId()}QueryOptions`)

    const generics = new FunctionParams()

    generics.add([
      { type: 'TData', default: schemas.response.name },
      { type: 'TError', default: errors.map((error) => error.name).join(' | ') || 'unknown' },
    ])

    const clientGenerics = ['TData', 'TError']
    const queryGenerics = [dataReturnType === 'data' ? 'TData' : 'ResponseConfig<TData>', 'TError']

    const params = createFunctionParams([
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

    codes.push(`
export function ${name} <
  ${generics.toString()}
>(
  ${params}
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
      }).then(res => ${dataReturnType === 'data' ? 'res.data' : 'res'});
    },
  };
};
`)

    return { code: combineCodes(codes), name }
  }

  private get query(): QueryResult {
    const { name, errors, operation, schemas, dataReturnType } = this.config
    const codes: string[] = []

    const queryOptionsName = this.queryOptions.name

    const comments = getComments(operation)

    const generics = new FunctionParams()

    generics.add([
      { type: 'TData', default: schemas.response.name },
      { type: 'TError', default: errors.map((error) => error.name).join(' | ') || 'unknown' },
    ])

    const clientGenerics = ['TData', 'TError']
    const queryGenerics = [dataReturnType === 'data' ? 'TData' : 'ResponseConfig<TData>', 'TError']
    const params = createFunctionParams([
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

    const queryParams = createFunctionParams([
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
    const queryOptions = `${queryOptionsName}<${clientGenerics.join(', ')}>(${queryParams})`

    codes.push(createJSDocBlockText({ comments }))
    codes.push(`
export function ${name} <${generics.toString()}>(${params}): SWRResponse<${queryGenerics.join(', ')}> {
  const { query: queryOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {};
  
  const url = shouldFetch ? ${new URLPath(operation.path).template} : null;
  const query = useSWR<${queryGenerics.join(', ')}, string | null>(url, {
    ...${queryOptions},
    ...queryOptions
  });

  return query;
};
`)

    return { code: combineCodes(codes), name }
  }

  private get mutation(): QueryResult {
    const { name, errors, operation, schemas } = this.config
    const codes: string[] = []

    const comments = getComments(operation)
    const method = operation.method

    const generics = new FunctionParams()

    generics.add([
      { type: 'TData', default: schemas.response.name },
      { type: 'TError', default: errors.map((error) => error.name).join(' | ') || 'unknown' },
      { type: 'TVariables', default: schemas.request?.name, enabled: !!schemas.request?.name },
    ])

    const clientGenerics = ['TData', 'TError', schemas.request?.name ? `TVariables` : undefined].filter(Boolean)

    const mutationGenerics = ['ResponseConfig<TData>', 'TError', 'string | null', schemas.request?.name ? `TVariables` : 'never'].filter(Boolean)

    const params = createFunctionParams([
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

    codes.push(createJSDocBlockText({ comments }))
    codes.push(`
export function ${name} <
  ${generics.toString()}
>(
  ${params}
): SWRMutationResponse<${mutationGenerics.join(', ')}> {
  const { mutation: mutationOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {};
  
  const url = shouldFetch ? ${new URLPath(operation.path).template} : null;
  return useSWRMutation<${mutationGenerics.join(', ')}>(
    url,
    (url${schemas.request?.name ? ', { arg: data }' : ''}) => {
      return client<${clientGenerics.join(', ')}>({
        method: "${method}",
        url,
        ${schemas.request?.name ? 'data,' : ''}
        ${schemas.queryParams?.name ? 'params,' : ''}
        ${schemas.headerParams?.name ? 'headers: { ...headers, ...clientOptions.headers },' : ''}
        ...clientOptions,
      })
    },
    mutationOptions
  );
};
`)

    return { code: combineCodes(codes), name }
  }

  configure(config: Config): this {
    this.config = config

    return this
  }

  print(type: 'query' | 'mutation', name: string): string {
    return this.render(type, name).output
  }

  render(type: 'query' | 'mutation', name: string): RootType<AppContextProps<AppMeta>> {
    const { pluginManager, operation, schemas } = this.config

    const root = createRoot<AppContextProps<AppMeta>>()

    const ComponentQuery = () => {
      const file = useResolve({ name, pluginName })

      return (
        <File baseName={file.fileName} path={file.filePath}>
          <File.Source>
            {this.queryOptions.code}
            <br />
            {this.query.code}
          </File.Source>
        </File>
      )
    }

    const ComponentMutation = () => {
      const file = useResolve({ name, pluginName })

      return (
        <File baseName={file.fileName} path={file.filePath}>
          <File.Source>{this.mutation.code}</File.Source>
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
