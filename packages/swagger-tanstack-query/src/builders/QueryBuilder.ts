/* eslint- @typescript-eslint/explicit-module-boundary-types */
import type { Import } from '@kubb/core'
import { createJSDocBlockText } from '@kubb/core'
import type { Resolver } from '@kubb/swagger'
import { OasBuilder, getComments, getDataParams } from '@kubb/swagger'

import { URLPath, combineCodes } from '@kubb/core'
import type { Operation, OperationSchemas } from '@kubb/swagger'
import { getParams } from '@kubb/swagger'
import { camelCase } from 'change-case'
import type { Framework, FrameworkImports } from '../types.ts'
import { createFunctionParams } from '@kubb/core'
import type { Options as PluginOptions } from '../types'

type BaseConfig = {
  dataReturnType: PluginOptions['dataReturnType']
  operation: Operation
  schemas: OperationSchemas
  framework: Framework
  frameworkImports: FrameworkImports
  errors: Resolver[]
}

type QueryConfig = BaseConfig & {
  infinite?: {
    queryParam?: string
  }
}

type MutationConfig = BaseConfig
type Config = QueryConfig | MutationConfig

type QueryResult = { code: string; name: string }

export class QueryBuilder extends OasBuilder<Config> {
  private get queryKey(): QueryResult {
    const { operation, schemas } = this.config
    const codes: string[] = []

    const name = camelCase(`${operation.getOperationId()}QueryKey`)

    const params = createFunctionParams([
      ...getDataParams(schemas.pathParams, { typed: true }),
      {
        name: 'params',
        type: schemas.queryParams?.name,
        enabled: !!schemas.queryParams?.name,
        required: !!schemas.queryParams?.schema.required?.length,
      },
    ])
    const result = [new URLPath(operation.path).template, schemas.queryParams?.name ? `...(params ? [params] : [])` : undefined].filter(Boolean)

    codes.push(`export const ${name} = (${params}) => [${result.join(',')}] as const;`)

    return { code: combineCodes(codes), name }
  }

  private get queryOptions(): QueryResult {
    const { operation, schemas, framework, frameworkImports, errors, dataReturnType } = this.config
    const codes: string[] = []

    const name = camelCase(`${operation.getOperationId()}QueryOptions`)
    const queryKeyName = this.queryKey.name

    const pathParams = getParams(schemas.pathParams)

    const generics = [`TData = ${schemas.response.name}`, `TError = ${errors.map((error) => error.name).join(' | ') || 'unknown'}`]
    const clientGenerics = ['TData', 'TError']
    const queryGenerics = [dataReturnType === 'data' ? 'TData' : 'ResponseConfig<TData>', 'TError']
    const params = createFunctionParams([
      ...getDataParams(schemas.pathParams, { typed: true }),
      {
        name: 'params',
        type: schemas.queryParams?.name,
        enabled: !!schemas.queryParams?.name,
        required: !!schemas.queryParams?.schema.required?.length,
      },
      {
        name: 'headers',
        type: schemas.headerParams?.name,
        enabled: !!schemas.headerParams?.name,
        required: !!schemas.headerParams?.schema.required?.length,
      },
      {
        name: 'options',
        type: 'Partial<Parameters<typeof client>[0]>',
        default: '{}',
      },
    ])
    let queryKey = `${queryKeyName}(${schemas.pathParams?.name ? `${pathParams}, ` : ''}${schemas.queryParams?.name ? 'params' : ''})`

    if (framework === 'solid') {
      queryKey = `() => ${queryKey}`
    }

    codes.push(`
export function ${name} <${generics.join(', ')}>(${params}): ${frameworkImports.query.UseQueryOptions}<${queryGenerics.join(', ')}> {
  const queryKey = ${queryKey};

  return {
    queryKey,
    queryFn: () => {
      return client<${clientGenerics.join(', ')}>({
        method: "get",
        url: ${new URLPath(operation.path).template},
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
    const { framework, frameworkImports, errors, operation, schemas, dataReturnType } = this.config
    const codes: string[] = []

    const queryKeyName = this.queryKey.name
    const queryOptionsName = this.queryOptions.name
    const name = frameworkImports.getName(operation)
    const pathParams = getParams(schemas.pathParams)
    const comments = getComments(operation)

    const generics = [`TData = ${schemas.response.name}`, `TError = ${errors.map((error) => error.name).join(' | ') || 'unknown'}`]
    const clientGenerics = ['TData', 'TError']
    const queryGenerics = [dataReturnType === 'data' ? 'TData' : 'ResponseConfig<TData>', 'TError']
    const params = createFunctionParams([
      ...getDataParams(schemas.pathParams, { typed: true }),
      {
        name: 'params',
        type: schemas.queryParams?.name,
        enabled: !!schemas.queryParams?.name,
        required: !!schemas.queryParams?.schema.required?.length,
      },
      {
        name: 'headers',
        type: schemas.headerParams?.name,
        enabled: !!schemas.headerParams?.name,
        required: !!schemas.headerParams?.schema.required?.length,
      },
      {
        name: 'options',
        type: `{ 
          query?: ${frameworkImports.query.UseQueryOptions}<${queryGenerics.join(', ')}>,
          client?: Partial<Parameters<typeof client<${clientGenerics.filter((generic) => generic !== 'unknown').join(', ')}>>[0]>,
        }`,
        default: '{}',
      },
    ])

    const queryKey = `${queryKeyName}(${schemas.pathParams?.name ? `${pathParams}, ` : ''}${schemas.queryParams?.name ? 'params' : ''})`
    const queryParams = createFunctionParams([
      ...getDataParams(schemas.pathParams, { typed: false }),
      {
        name: 'params',
        enabled: !!schemas.queryParams?.name,
        required: !!schemas.queryParams?.schema.required?.length,
      },
      {
        name: 'headers',
        enabled: !!schemas.headerParams?.name,
        required: !!schemas.headerParams?.schema.required?.length,
      },
      {
        name: 'clientOptions',
        required: false,
      },
    ])
    const queryOptions = `${queryOptionsName}<${clientGenerics.join(', ')}>(${queryParams})`

    codes.push(createJSDocBlockText({ comments }))
    codes.push(`
export function ${name} <${generics.join(',')}>(${params}): ${frameworkImports.query.UseQueryResult}<${queryGenerics.join(', ')}> & { queryKey: QueryKey } {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {};
  const queryKey = queryOptions?.queryKey${framework === 'solid' ? `?.()` : ''} ?? ${queryKey};
  
  const query = ${frameworkImports.query.useQuery}<${queryGenerics.join(', ')}>({
    ...${queryOptions},
    ...queryOptions
  }) as ${frameworkImports.query.UseQueryResult}<${queryGenerics.join(', ')}> & { queryKey: QueryKey };

  query.queryKey = queryKey as QueryKey;

  return query;
};
`)

    return { code: combineCodes(codes), name }
  }

  //infinite
  private get queryOptionsInfinite(): QueryResult {
    const { framework, frameworkImports, errors, operation, schemas, infinite: { queryParam = 'id' } = {}, dataReturnType } = this.config as QueryConfig
    const codes: string[] = []

    const name = camelCase(`${operation.getOperationId()}QueryOptionsInfinite`)

    const queryKeyName = this.queryKey.name

    const pathParams = getParams(schemas.pathParams)

    const generics = [`TData = ${schemas.response.name}`, `TError = ${errors.map((error) => error.name).join(' | ') || 'unknown'}`]
    const clientGenerics = ['TData', 'TError']
    const queryGenerics = [dataReturnType === 'data' ? 'TData' : 'ResponseConfig<TData>', 'TError']
    const params = createFunctionParams([
      ...getDataParams(schemas.pathParams, { typed: true }),
      {
        name: 'params',
        type: schemas.queryParams?.name,
        enabled: !!schemas.queryParams?.name,
        required: !!schemas.queryParams?.schema.required?.length,
      },
      {
        name: 'headers',
        type: schemas.headerParams?.name,
        enabled: !!schemas.headerParams?.name,
        required: !!schemas.headerParams?.schema.required?.length,
      },
      {
        name: 'options',
        type: 'Partial<Parameters<typeof client>[0]>',
        default: '{}',
      },
    ])
    let queryKey = `${queryKeyName}(${schemas.pathParams?.name ? `${pathParams}, ` : ''}${schemas.queryParams?.name ? 'params' : ''})`

    if (framework === 'solid') {
      queryKey = `() => ${queryKey}`
    }

    codes.push(`
export function ${name} <${generics.join(', ')}>(${params}): ${frameworkImports.query.UseInfiniteQueryOptions}<${queryGenerics.join(', ')}> {
  const queryKey = ${queryKey};

  return {
    queryKey,
    queryFn: ({ pageParam }) => {
      return client<${clientGenerics.join(', ')}>({
        method: "get",
        url: ${new URLPath(operation.path).template},
        ${schemas.headerParams?.name ? 'headers: { ...headers, ...options.headers },' : ''}
        ...options,
        ${
          schemas.queryParams?.name
            ? `params: {
          ...params,
          ['${queryParam}']: pageParam,
          ...(options.params || {}),
        }`
            : ''
        }
      }).then(res => ${dataReturnType === 'data' ? 'res.data' : 'res'});
    },
  };
};
  `)

    return { code: combineCodes(codes), name }
  }

  private get queryInfinite(): QueryResult {
    const { framework, frameworkImports, errors, operation, schemas, dataReturnType } = this.config
    const codes: string[] = []

    const queryKeyName = this.queryKey.name
    const queryOptionsName = this.queryOptionsInfinite.name // changed
    const name = `${frameworkImports.getName(operation)}Infinite`
    const pathParams = getParams(schemas.pathParams)
    const comments = getComments(operation)

    const generics = [`TData = ${schemas.response.name}`, `TError = ${errors.map((error) => error.name).join(' | ') || 'unknown'}`]
    const clientGenerics = ['TData', 'TError']
    const queryGenerics = [dataReturnType === 'data' ? 'TData' : 'ResponseConfig<TData>', 'TError']
    const params = createFunctionParams([
      ...getDataParams(schemas.pathParams, { typed: true }),
      {
        name: 'params',
        type: schemas.queryParams?.name,
        enabled: !!schemas.queryParams?.name,
        required: !!schemas.queryParams?.schema.required?.length,
      },
      {
        name: 'headers',
        type: schemas.headerParams?.name,
        enabled: !!schemas.headerParams?.name,
        required: !!schemas.headerParams?.schema.required?.length,
      },
      {
        name: 'options',
        type: `{ 
          query?: ${frameworkImports.query.UseInfiniteQueryOptions}<${queryGenerics.join(', ')}>,
          client?: Partial<Parameters<typeof client<${clientGenerics.filter((generic) => generic !== 'unknown').join(', ')}>>[0]>,
        }`,
        default: '{}',
      },
    ])

    const queryKey = `${queryKeyName}(${schemas.pathParams?.name ? `${pathParams}, ` : ''}${schemas.queryParams?.name ? 'params' : ''})`
    const queryParams = createFunctionParams([
      ...getDataParams(schemas.pathParams, { typed: false }),
      {
        name: 'params',
        enabled: !!schemas.queryParams?.name,
        required: !!schemas.queryParams?.schema.required?.length,
      },
      {
        name: 'headers',
        enabled: !!schemas.headerParams?.name,
        required: !!schemas.headerParams?.schema.required?.length,
      },
      {
        name: 'clientOptions',
        required: false,
      },
    ])
    const queryOptions = `${queryOptionsName}<${clientGenerics.join(', ')}>(${queryParams})`

    codes.push(createJSDocBlockText({ comments }))
    codes.push(`
export function ${name} <${generics.join(',')}>(${params}): ${frameworkImports.query.UseInfiniteQueryResult}<${queryGenerics.join(
      ', ',
    )}> & { queryKey: QueryKey } {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {};
  const queryKey = queryOptions?.queryKey${framework === 'solid' ? `?.()` : ''} ?? ${queryKey};
  
  const query = ${frameworkImports.query.useInfiniteQuery}<${queryGenerics.join(', ')}>({
    ...${queryOptions},
    ...queryOptions
  }) as ${frameworkImports.query.UseInfiniteQueryResult}<${queryGenerics.join(', ')}> & { queryKey: QueryKey };

  query.queryKey = queryKey as QueryKey;

  return query;
};
`)

    return { code: combineCodes(codes), name }
  }

  private get mutation(): QueryResult {
    const { framework, frameworkImports, errors, operation, schemas } = this.config as MutationConfig
    const codes: string[] = []

    const name = frameworkImports.getName(operation)

    const comments = getComments(operation)
    const method = operation.method

    const generics = [
      `TData = ${schemas.response.name}`,
      `TError = ${errors.map((error) => error.name).join(' | ') || 'unknown'}`,
      schemas.request?.name ? `TVariables = ${schemas.request?.name}` : undefined,
    ].filter(Boolean)
    const clientGenerics = ['TData', 'TError', schemas.request?.name ? `TVariables` : 'void', framework === 'vue' ? 'unknown' : undefined].filter(Boolean)
    const mutationGenerics = [
      'ResponseConfig<TData>',
      'TError',
      schemas.request?.name ? `TVariables` : 'void',
      framework === 'vue' ? 'unknown' : undefined,
    ].filter(Boolean)
    const params = createFunctionParams([
      ...getDataParams(schemas.pathParams, { typed: true }),
      {
        name: 'params',
        type: schemas.queryParams?.name,
        enabled: !!schemas.queryParams?.name,
        required: !!schemas.queryParams?.schema.required?.length,
      },
      {
        name: 'headers',
        type: schemas.headerParams?.name,
        enabled: !!schemas.headerParams?.name,
        required: !!schemas.headerParams?.schema.required?.length,
      },
      {
        name: 'options',
        type: `{
          mutation?: ${frameworkImports.mutate.UseMutationOptions}<${mutationGenerics.join(', ')}>,
          client?: Partial<Parameters<typeof client<${clientGenerics.filter((generic) => generic !== 'unknown').join(', ')}>>[0]>,
      }`,
        default: '{}',
      },
    ])

    codes.push(createJSDocBlockText({ comments }))
    codes.push(`
export function ${name} <${generics.join(',')}>(${params}): ${frameworkImports.mutate.UseMutationResult}<${mutationGenerics.join(', ')}> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {};
  
  return ${frameworkImports.mutate.useMutation}<${mutationGenerics.join(', ')}>({
    mutationFn: (${schemas.request?.name ? 'data' : ''}) => {
      return client<${clientGenerics.filter((generic) => generic !== 'unknown').join(', ')}>({
        method: "${method}",
        url: ${new URLPath(operation.path).template},
        ${schemas.request?.name ? 'data,' : ''}
        ${schemas.queryParams?.name ? 'params,' : ''}
        ${schemas.headerParams?.name ? 'headers: { ...headers, ...clientOptions.headers },' : ''}
        ...clientOptions
      });
    },
    ...mutationOptions
  });
};
`)

    return { code: combineCodes(codes), name }
  }

  configure(config: Config): this {
    this.config = config

    return this
  }

  print(type: 'query' | 'mutation'): string {
    const { infinite } = this.config as QueryConfig

    const codes: string[] = []

    //query
    const { code: queryKey } = this.queryKey
    const { code: queryOptions } = this.queryOptions
    const { code: query } = this.query

    const { code: queryOptionsInfinite } = this.queryOptionsInfinite
    const { code: queryInfinite } = this.queryInfinite

    //mutate

    const { code: mutation } = this.mutation

    if (type === 'query') {
      codes.push(queryKey, queryOptions, query)
      if (infinite) {
        codes.push(queryOptionsInfinite, queryInfinite)
      }
    }

    if (type === 'mutation') {
      codes.push(mutation)
    }

    return codes.join('\n')
  }

  imports(type: 'query' | 'mutation'): Import[] {
    return []
  }
}
