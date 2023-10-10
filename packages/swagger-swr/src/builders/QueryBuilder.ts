/* eslint- @typescript-eslint/explicit-module-boundary-types */
import { combineCodes, createFunctionParams, createJSDocBlockText, URLPath } from '@kubb/core'
import { getASTParams, getComments, OasBuilder } from '@kubb/swagger'

import { camelCase } from 'change-case'

import type { Operation, OperationSchemas, Resolver } from '@kubb/swagger'
import type { Options as PluginOptions } from '../types'

type Config = {
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

    const generics = [`TData = ${schemas.response.name}`, `TError = ${errors.map((error) => error.name).join(' | ') || 'unknown'}`]
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
  ${generics.join(', ')}
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

    const generics = [`TData = ${schemas.response.name}`, `TError = ${errors.map((error) => error.name).join(' | ') || 'unknown'}`]
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
export function ${name} <${generics.join(', ')}>(${params}): SWRResponse<${queryGenerics.join(', ')}> {
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

    const generics = [
      `TData = ${schemas.response.name}`,
      `TError = ${errors.map((error) => error.name).join(' | ') || 'unknown'}`,
      schemas.request?.name ? `TVariables = ${schemas.request?.name}` : undefined,
    ].filter(Boolean)

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
  ${generics.join(', ')}
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

  print(type: 'query' | 'mutation'): string {
    const codes: string[] = []

    //query
    const { code: queryOptions } = this.queryOptions
    const { code: query } = this.query

    //mutate

    const { code: mutation } = this.mutation

    if (type === 'query') {
      codes.push(queryOptions, query)
    }

    if (type === 'mutation') {
      codes.push(mutation)
    }

    return codes.join('\n')
  }
}
