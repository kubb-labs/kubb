/* eslint- @typescript-eslint/explicit-module-boundary-types */
import { createJSDocBlockText } from '@kubb/core'
import type { Resolver } from '@kubb/swagger'
import { OasBuilder, getComments } from '@kubb/swagger'

import { URLPath, combineCodes } from '@kubb/core'
import type { Operation, OperationSchemas } from '@kubb/swagger'
import { getParams } from '@kubb/swagger'
import { camelCase } from 'change-case'

type Config = {
  operation: Operation
  schemas: OperationSchemas
  errors: Resolver[]
  name: string
}

type QueryResult = { code: string; name: string }

export class QueryBuilder extends OasBuilder<Config> {
  private get queryOptions(): QueryResult {
    const { operation, schemas, errors } = this.config
    const codes: string[] = []

    const name = camelCase(`${operation.getOperationId()}QueryOptions`)
    const pathParamsTyped = getParams(schemas.pathParams, { typed: true })

    const generics = [`TData = ${schemas.response.name}`, `TError = ${errors.map((error) => error.name).join(' | ') || 'unknown'}`]
    const clientGenerics = ['TData', 'TError']
    const options = [
      pathParamsTyped,
      schemas.queryParams?.name ? `params${!schemas.queryParams.schema.required?.length ? '?' : ''}: ${schemas.queryParams.name}` : undefined,
      schemas.headerParams?.name ? `headers${!schemas.headerParams.schema.required?.length ? '?' : ''}: ${schemas.headerParams.name}` : undefined,
      'options: Partial<Parameters<typeof client>[0]> = {}',
    ].filter(Boolean)

    codes.push(`
export function ${name} <${generics.join(', ')}>(${options.join(', ')}): SWRConfiguration<${clientGenerics.join(', ')}> {
  return {
    fetcher: () => {
      return client<${clientGenerics.join(', ')}>({
        method: "get",
        url: ${new URLPath(operation.path).template},
        ${schemas.request?.name ? 'data,' : ''}
        ${schemas.queryParams?.name ? 'params,' : ''}
        ${schemas.headerParams?.name ? 'headers: { ...headers, ...options.headers },' : ''}
        ...options,
      });
    },
  };
};
`)

    return { code: combineCodes(codes), name }
  }

  private get query(): QueryResult {
    const { name, errors, operation, schemas } = this.config
    const codes: string[] = []

    const queryOptionsName = this.queryOptions.name

    const pathParams = getParams(schemas.pathParams)
    const pathParamsTyped = getParams(schemas.pathParams, { typed: true })
    const comments = getComments(operation)

    const generics = [`TData = ${schemas.response.name}`, `TError = ${errors.map((error) => error.name).join(' | ') || 'unknown'}`]
    const clientGenerics = ['TData', 'TError']
    const options = [
      pathParamsTyped,
      schemas.queryParams?.name ? `params${!schemas.queryParams.schema.required?.length ? '?' : ''}: ${schemas.queryParams.name}` : '',
      `options?: { query?: SWRConfiguration<${clientGenerics.join(', ')}> }`,
    ].filter(Boolean)

    const queryOptions = `${queryOptionsName}<${clientGenerics.join(', ')}>(${schemas.pathParams?.name ? `${pathParams}, ` : ''}${
      schemas.queryParams?.name ? 'params' : ''
    })`

    codes.push(createJSDocBlockText({ comments }))
    codes.push(`
export function ${name} <${generics.join(', ')}>(${options.join(', ')}): SWRResponse<${clientGenerics.join(', ')}> {
  const { query: queryOptions } = options ?? {};
  
  const query = useSWR<${clientGenerics.join(', ')}, string>(${new URLPath(operation.path).template}, {
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

    const pathParamsTyped = getParams(schemas.pathParams, { typed: true })
    const comments = getComments(operation)
    const method = operation.method

    const generics = [
      `TData = ${schemas.response.name}`,
      `TError = ${errors.map((error) => error.name).join(' | ') || 'unknown'}`,
      schemas.request?.name ? `TVariables = ${schemas.request?.name}` : undefined,
    ].filter(Boolean)
    const clientGenerics = ['TData', 'TError', schemas.request?.name ? `TVariables` : undefined].filter(Boolean)
    //start mutate specific
    //TODO move client.post to it's own function
    const SWRMutationGenerics = ['TData', 'TError', 'string', schemas.request?.name ? `TVariables` : undefined].filter(Boolean)
    const SWRMutationConfigurationGenerics = ['TData', 'TError', 'string', schemas.request?.name ? `TVariables` : undefined].filter(Boolean)
    //end mutate specific
    const options = [
      pathParamsTyped,
      schemas.queryParams?.name ? `params${!schemas.queryParams.schema.required?.length ? '?' : ''}: ${schemas.queryParams.name}` : '',
      schemas.headerParams?.name ? `headers${!schemas.headerParams.schema.required?.length ? '?' : ''}: ${schemas.headerParams.name}` : undefined,
      `options?: {
        mutation?: SWRMutationConfiguration<${SWRMutationConfigurationGenerics.join(', ')}>
      }`,
    ].filter(Boolean)

    codes.push(createJSDocBlockText({ comments }))
    codes.push(`
export function ${name} <${generics.join(', ')}>(${options.join(', ')}): SWRMutationResponse<${SWRMutationGenerics.join(', ')}> {
  const { mutation: mutationOptions } = options ?? {};

  return useSWRMutation<${SWRMutationGenerics.join(', ')}>(
  ${new URLPath(operation.path).template},
    (url${schemas.request?.name ? ', { arg: data }' : ''}) => {
      return client<${clientGenerics.join(', ')}>({
        method: "${method}",
        url,
        ${schemas.request?.name ? 'data,' : ''}
        ${schemas.queryParams?.name ? 'params,' : ''}
        ${schemas.headerParams?.name ? 'headers: { ...headers, ...options.headers },' : ''}
        ...options,
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
