/* eslint- @typescript-eslint/explicit-module-boundary-types */
import { createJSDocBlockText } from '@kubb/core'
import type { Resolver } from '@kubb/swagger'
import { OasBuilder, getComments } from '@kubb/swagger'

import { URLPath } from '@kubb/core'
import type { Operation, OperationSchemas } from '@kubb/swagger'
import { getParams } from '@kubb/swagger'
import { camelCase } from 'change-case'
import type { Framework, FrameworkImports } from '../types.ts'

type BaseConfig = {
  operation: Operation
  schemas: OperationSchemas
  framework: Framework
  frameworkImports: FrameworkImports
  errors: Resolver[]
}

type QueryConfig = BaseConfig & {
  queryParam?: string
}

type MutationConfig = BaseConfig
type Config = QueryConfig | MutationConfig

type QueryResult = { source: string; name: string }

export class QueryBuilder extends OasBuilder<Config> {
  private get queryKey(): QueryResult {
    const { operation, schemas } = this.config
    const name = camelCase(`${operation.getOperationId()}QueryKey`)

    const pathParamsTyped = getParams(schemas.pathParams, { typed: true })

    const options = [
      pathParamsTyped,
      schemas.queryParams?.name ? `params${!schemas.queryParams.schema.required?.length ? '?' : ''}: ${schemas.queryParams.name}` : undefined,
    ].filter(Boolean)
    const result = [new URLPath(operation.path).template, schemas.queryParams?.name ? `...(params ? [params] : [])` : undefined].filter(Boolean)

    const source = `export const ${name} = (${options.join(', ')}) => [${result.join(',')}] as const;`

    return { source, name }
  }

  private get queryOptions(): QueryResult {
    const { operation, schemas, framework, frameworkImports, errors } = this.config

    const name = camelCase(`${operation.getOperationId()}QueryOptions`)
    const queryKeyName = this.queryKey.name

    const pathParams = getParams(schemas.pathParams)
    const pathParamsTyped = getParams(schemas.pathParams, { typed: true })

    const generics = [`TData = ${schemas.response.name}`, `TError = ${errors.map((error) => error.name).join(' | ') || 'unknown'}`]
    const clientGenerics = ['TData', 'TError']
    const options = [
      pathParamsTyped,
      schemas.queryParams?.name ? `params${!schemas.queryParams.schema.required?.length ? '?' : ''}: ${schemas.queryParams.name}` : undefined,
    ].filter(Boolean)
    let queryKey = `${queryKeyName}(${schemas.pathParams?.name ? `${pathParams}, ` : ''}${schemas.queryParams?.name ? 'params' : ''})`

    if (framework === 'solid') {
      queryKey = `() => ${queryKey}`
    }

    const source = `
    export function ${name} <${generics.join(', ')}>(${options.join(', ')}): ${frameworkImports.query.UseQueryOptions}<${clientGenerics.join(', ')}> {
      const queryKey = ${queryKey};

      return {
        queryKey,
        queryFn: () => {
          return client<${clientGenerics.join(', ')}>({
            method: "get",
            url: ${new URLPath(operation.path).template},
            ${schemas.queryParams?.name ? 'params' : ''}
          });
        },
      };
    };
  `

    return { source, name }
  }

  private get query(): QueryResult {
    const { framework, frameworkImports, errors, operation, schemas } = this.config

    const queryKeyName = this.queryKey.name
    const queryOptionsName = this.queryOptions.name
    const name = frameworkImports.getName(operation)
    const pathParams = getParams(schemas.pathParams)
    const pathParamsTyped = getParams(schemas.pathParams, { typed: true })
    const comments = getComments(operation)

    const generics = [`TData = ${schemas.response.name}`, `TError = ${errors.map((error) => error.name).join(' | ') || 'unknown'}`]
    const clientGenerics = ['TData', 'TError']
    const options = [
      pathParamsTyped,
      schemas.queryParams?.name ? `params${!schemas.queryParams.schema.required?.length ? '?' : ''}: ${schemas.queryParams.name}` : '',
      `options?: { query?: ${frameworkImports.query.UseQueryOptions}<${clientGenerics.join(', ')}> }`,
    ].filter(Boolean)
    const queryKey = `${queryKeyName}(${schemas.pathParams?.name ? `${pathParams}, ` : ''}${schemas.queryParams?.name ? 'params' : ''})`
    const queryOptions = `${queryOptionsName}<${clientGenerics.join(', ')}>(${schemas.pathParams?.name ? `${pathParams}, ` : ''}${
      schemas.queryParams?.name ? 'params' : ''
    })`

    const source = `
    ${createJSDocBlockText({ comments })}
    export function ${name} <${generics.join(',')}>(${options.join(', ')}): ${frameworkImports.query.UseQueryResult}<${clientGenerics.join(
      ', ',
    )}> & { queryKey: QueryKey } {
      const { query: queryOptions } = options ?? {};
      const queryKey = queryOptions?.queryKey${framework === 'solid' ? `?.()` : ''} ?? ${queryKey};
      
      const query = ${frameworkImports.query.useQuery}<${clientGenerics.join(', ')}>({
        ...${queryOptions},
        ...queryOptions
      }) as ${frameworkImports.query.UseQueryResult}<${clientGenerics.join(', ')}> & { queryKey: QueryKey };

      query.queryKey = queryKey as QueryKey;

      return query;
    };
  `

    return { source, name }
  }

  //infinite
  private get queryOptionsInfinite(): QueryResult {
    const { framework, frameworkImports, errors, operation, schemas, queryParam = 'id' } = this.config as QueryConfig
    const name = camelCase(`${operation.getOperationId()}QueryOptionsInfinite`)

    const queryKeyName = this.queryKey.name

    const pathParams = getParams(schemas.pathParams)
    const pathParamsTyped = getParams(schemas.pathParams, { typed: true })

    const generics = [`TData = ${schemas.response.name}`, `TError = ${errors.map((error) => error.name).join(' | ') || 'unknown'}`]
    const clientGenerics = ['TData', 'TError']
    const options = [
      pathParamsTyped,
      schemas.queryParams?.name ? `params${!schemas.queryParams.schema.required?.length ? '?' : ''}: ${schemas.queryParams.name}` : undefined,
    ].filter(Boolean)
    let queryKey = `${queryKeyName}(${schemas.pathParams?.name ? `${pathParams}, ` : ''}${schemas.queryParams?.name ? 'params' : ''})`

    if (framework === 'solid') {
      queryKey = `() => ${queryKey}`
    }

    const source = `
    export function ${name} <${generics.join(', ')}>(${options.join(', ')}): ${frameworkImports.query.UseInfiniteQueryOptions}<${clientGenerics.join(', ')}> {
      const queryKey = ${queryKey};

      return {
        queryKey,
        queryFn: ({ pageParam }) => {
          return client<${clientGenerics.join(', ')}>({
            method: "get",
            url: ${new URLPath(operation.path).template},
            ${
              schemas.queryParams?.name
                ? `params: {
              ...params,
              ['${queryParam}']: pageParam,
            }`
                : ''
            }
          });
        },
      };
    };
  `

    return { source, name }
  }

  private get queryInfinite(): QueryResult {
    const { framework, frameworkImports, errors, operation, schemas } = this.config

    const queryKeyName = this.queryKey.name
    const queryOptionsName = this.queryOptionsInfinite.name // changed
    const name = `${frameworkImports.getName(operation)}Infinite`
    const pathParams = getParams(schemas.pathParams)
    const pathParamsTyped = getParams(schemas.pathParams, { typed: true })
    const comments = getComments(operation)

    const generics = [`TData = ${schemas.response.name}`, `TError = ${errors.map((error) => error.name).join(' | ') || 'unknown'}`]
    const clientGenerics = ['TData', 'TError']
    const options = [
      pathParamsTyped,
      schemas.queryParams?.name ? `params${!schemas.queryParams.schema.required?.length ? '?' : ''}: ${schemas.queryParams.name}` : '',
      `options?: { query?: ${frameworkImports.query.UseInfiniteQueryOptions}<${clientGenerics.join(', ')}> }`,
    ].filter(Boolean)
    const queryKey = `${queryKeyName}(${schemas.pathParams?.name ? `${pathParams}, ` : ''}${schemas.queryParams?.name ? 'params' : ''})`
    const queryOptions = `${queryOptionsName}<${clientGenerics.join(', ')}>(${schemas.pathParams?.name ? `${pathParams}, ` : ''}${
      schemas.queryParams?.name ? 'params' : ''
    })`

    const source = `
    ${createJSDocBlockText({ comments })}
    export function ${name} <${generics.join(',')}>(${options.join(', ')}): ${frameworkImports.query.UseInfiniteQueryResult}<${clientGenerics.join(
      ', ',
    )}> & { queryKey: QueryKey } {
      const { query: queryOptions } = options ?? {};
      const queryKey = queryOptions?.queryKey${framework === 'solid' ? `?.()` : ''} ?? ${queryKey};
      
      const query = ${frameworkImports.query.useInfiniteQuery}<${clientGenerics.join(', ')}>({
        ...${queryOptions},
        ...queryOptions
      }) as ${frameworkImports.query.UseInfiniteQueryResult}<${clientGenerics.join(', ')}> & { queryKey: QueryKey };

      query.queryKey = queryKey as QueryKey;

      return query;
    };
  `

    return { source, name }
  }

  private get mutation(): QueryResult {
    const { framework, frameworkImports, errors, operation, schemas } = this.config as MutationConfig

    const name = frameworkImports.getName(operation)
    const pathParamsTyped = getParams(schemas.pathParams, { typed: true })
    const comments = getComments(operation)
    const method = operation.method

    const generics = [
      `TData = ${schemas.response.name}`,
      `TError = ${errors.map((error) => error.name).join(' | ') || 'unknown'}`,
      schemas.request?.name ? `TVariables = ${schemas.request?.name}` : undefined,
    ].filter(Boolean)
    const clientGenerics = ['TData', 'TError', schemas.request?.name ? `TVariables` : 'void', framework === 'vue' ? 'unknown' : undefined].filter(Boolean)
    const options = [
      pathParamsTyped,
      schemas.queryParams?.name ? `params${!schemas.queryParams.schema.required?.length ? '?' : ''}: ${schemas.queryParams.name}` : '',
      `options?: {
        mutation?: ${frameworkImports.mutate.UseMutationOptions}<${clientGenerics.join(', ')}>
    }`,
    ].filter(Boolean)

    const source = `
    ${createJSDocBlockText({ comments })}
    export function ${name} <${generics.join(',')}>(${options.join(', ')}): ${frameworkImports.mutate.UseMutationResult}<${clientGenerics.join(', ')}> {
      const { mutation: mutationOptions } = options ?? {};
      
      return ${frameworkImports.mutate.useMutation}<${clientGenerics.join(', ')}>({
        mutationFn: (${schemas.request?.name ? 'data' : ''}) => {
          return client<${clientGenerics.filter((generic) => generic !== 'unknown').join(', ')}>({
            method: "${method}",
            url: ${new URLPath(operation.path).template},
            ${schemas.request?.name ? 'data,' : ''}
            ${schemas.queryParams?.name ? 'params,' : ''}
          });
        },
        ...mutationOptions
      });
    };
  `

    return { source, name }
  }

  configure(config: Config): this {
    this.config = config

    return this
  }

  print(type: 'query' | 'mutation'): string {
    const codes: string[] = []

    //query
    const { source: queryKey } = this.queryKey
    const { source: queryOptions } = this.queryOptions
    const { source: query } = this.query

    const { source: queryOptionsInfinite } = this.queryOptionsInfinite
    const { source: queryInfinite } = this.queryInfinite

    //mutate

    const { source: mutation } = this.mutation

    if (type === 'query') {
      codes.push(queryKey, queryOptions, query)
      codes.push(queryOptionsInfinite, queryInfinite)
    }

    if (type === 'mutation') {
      codes.push(mutation)
    }

    return codes.join('\n')
  }
}
