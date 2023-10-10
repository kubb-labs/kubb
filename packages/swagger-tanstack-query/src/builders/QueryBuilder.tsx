/* eslint- @typescript-eslint/explicit-module-boundary-types */
import { combineCodes, createFunctionParams, createJSDocBlockText, URLPath } from '@kubb/core'
import { render } from '@kubb/react-template'
import { getComments, getDataParams, getParams, OasBuilder } from '@kubb/swagger'

import { camelCase, pascalCase } from 'change-case'

import { QueryKeyFunction } from '../components/index.ts'

import type { Import, PluginManager } from '@kubb/core'
import type { AppContextProps } from '@kubb/react-template'
import type { Operation, OperationSchemas, Resolver } from '@kubb/swagger'
import type { AppMeta, Framework, FrameworkImports, Options as PluginOptions } from '../types.ts'

type BaseConfig = {
  pluginManager: PluginManager
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

type QueryResult = { code: string; name: string; imports: Import[] }

export class QueryBuilder extends OasBuilder<Config> {
  private get queryKey(): QueryResult {
    const { pluginManager, operation, schemas, framework } = this.config
    const codes: string[] = []

    const name = camelCase(`${operation.getOperationId()}QueryKey`)
    const FrameworkComponent = QueryKeyFunction[framework]

    const Component = () => {
      return (
        <>
          <FrameworkComponent name={name} />
        </>
      )
    }
    const { output, imports } = render<AppContextProps<AppMeta>>(<Component />, { context: { meta: { pluginManager, schemas, operation } } })

    codes.push(output)

    return { code: combineCodes(codes), name, imports }
  }

  private get queryOptions(): QueryResult {
    const { operation, schemas, framework, frameworkImports, errors, dataReturnType } = this.config
    const codes: string[] = []

    const name = camelCase(`${operation.getOperationId()}QueryOptions`)
    const queryKeyName = this.queryKey.name

    const pathParams = getParams(schemas.pathParams, {
      override: framework === 'vue' ? (item) => ({ ...item, name: `ref${pascalCase(item.name)}` }) : undefined,
    })

    const generics = [`TData = ${schemas.response.name}`, `TError = ${errors.map((error) => error.name).join(' | ') || 'unknown'}`]
    const clientGenerics = ['TData', 'TError']
    const queryGenerics = [dataReturnType === 'data' ? 'TData' : 'ResponseConfig<TData>', 'TError']
    const paramsData = [
      ...getDataParams(schemas.pathParams, {
        typed: true,
        override: framework === 'vue' ? (item) => ({ ...item, name: `ref${pascalCase(item.name)}`, type: `MaybeRef<${item.type}>` }) : undefined,
      }),
      {
        name: framework === 'vue' ? 'refParams' : 'params',
        type: framework === 'vue' && schemas.queryParams?.name ? `MaybeRef<${schemas.queryParams?.name}>` : schemas.queryParams?.name,
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
        type: 'Partial<Parameters<typeof client>[0]>',
        default: '{}',
      },
    ]
    const params = createFunctionParams(paramsData)

    const unrefs =
      framework === 'vue'
        ? paramsData
            .filter((item) => item.type?.startsWith('MaybeRef<'))
            .map((item) => {
              return `const ${camelCase(item.name.replace('ref', ''))} = unref(${item.name})`
            })
            .join('\n')
        : ''

    let queryKey = `${queryKeyName}(${schemas.pathParams?.name ? `${pathParams}, ` : ''}${schemas.queryParams?.name ? 'params' : ''})`

    if (framework === 'solid') {
      queryKey = `() => ${queryKey}`
    }
    if (framework === 'vue') {
      queryKey = `${queryKeyName}(${schemas.pathParams?.name ? `${pathParams}, ` : ''}${schemas.queryParams?.name ? 'refParams' : ''})`
    }

    codes.push(`
export function ${name} <${generics.join(', ')}>(${params}): ${frameworkImports.query.UseQueryOptions}<${queryGenerics.join(', ')}> {
  const queryKey = ${queryKey};
  
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
      }).then(res => ${dataReturnType === 'data' ? 'res.data' : 'res'});
    },
  };
};
`)

    return { code: combineCodes(codes), name, imports: [] }
  }

  private get query(): QueryResult {
    const { framework, frameworkImports, errors, operation, schemas, dataReturnType } = this.config
    const codes: string[] = []

    const queryKeyName = this.queryKey.name
    const queryOptionsName = this.queryOptions.name
    const name = frameworkImports.getName(operation)
    const pathParams = getParams(schemas.pathParams, {
      override: framework === 'vue' ? (item) => ({ ...item, name: `ref${pascalCase(item.name)}` }) : undefined,
    })
    const comments = getComments(operation)

    const generics = [`TData = ${schemas.response.name}`, `TError = ${errors.map((error) => error.name).join(' | ') || 'unknown'}`]
    const clientGenerics = ['TData', 'TError']
    const queryGenerics = [dataReturnType === 'data' ? 'TData' : 'ResponseConfig<TData>', 'TError']
    const params = createFunctionParams([
      ...getDataParams(schemas.pathParams, {
        typed: true,
        override: framework === 'vue' ? (item) => ({ ...item, name: `ref${pascalCase(item.name)}`, type: `MaybeRef<${item.type}>` }) : undefined,
      }),
      {
        name: framework === 'vue' ? 'refParams' : 'params',
        type: framework === 'vue' && schemas.queryParams?.name ? `MaybeRef<${schemas.queryParams?.name}>` : schemas.queryParams?.name,
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
        type: `{ 
          query?: ${frameworkImports.query.UseQueryOptions}<${queryGenerics.join(', ')}>,
          client?: Partial<Parameters<typeof client<${clientGenerics.filter((generic) => generic !== 'unknown').join(', ')}>>[0]>,
        }`,
        default: '{}',
      },
    ])

    const queryKey = `${queryKeyName}(${schemas.pathParams?.name ? `${pathParams}, ` : ''}${
      schemas.queryParams?.name ? (framework === 'vue' ? 'refParams' : 'params') : ''
    })`
    const queryParams = createFunctionParams([
      ...getDataParams(schemas.pathParams, {
        typed: false,
        override: framework === 'vue' ? (item) => ({ ...item, name: `ref${pascalCase(item.name)}` }) : undefined,
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

    return { code: combineCodes(codes), name, imports: [] }
  }

  //infinite
  private get queryOptionsInfinite(): QueryResult {
    const { framework, frameworkImports, errors, operation, schemas, infinite: { queryParam = 'id' } = {}, dataReturnType } = this.config as QueryConfig
    const codes: string[] = []

    const name = camelCase(`${operation.getOperationId()}QueryOptionsInfinite`)

    const queryKeyName = this.queryKey.name

    const pathParams = getParams(schemas.pathParams, {
      override: framework === 'vue' ? (item) => ({ ...item, name: `ref${pascalCase(item.name)}` }) : undefined,
    })

    const generics = [`TData = ${schemas.response.name}`, `TError = ${errors.map((error) => error.name).join(' | ') || 'unknown'}`]
    const clientGenerics = ['TData', 'TError']
    const queryGenerics = [dataReturnType === 'data' ? 'TData' : 'ResponseConfig<TData>', 'TError']
    const paramsData = [
      ...getDataParams(schemas.pathParams, {
        typed: true,
        override: framework === 'vue' ? (item) => ({ ...item, name: `ref${pascalCase(item.name)}`, type: `MaybeRef<${item.type}>` }) : undefined,
      }),
      {
        name: framework === 'vue' ? 'refParams' : 'params',
        type: framework === 'vue' && schemas.queryParams?.name ? `MaybeRef<${schemas.queryParams?.name}>` : schemas.queryParams?.name,
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
        type: 'Partial<Parameters<typeof client>[0]>',
        default: '{}',
      },
    ]
    const params = createFunctionParams(paramsData)

    const unrefs =
      framework === 'vue'
        ? paramsData
            .filter((item) => item.type?.startsWith('MaybeRef<'))
            .map((item) => {
              return `const ${camelCase(item.name.replace('ref', ''))} = unref(${item.name})`
            })
            .join('\n')
        : ''
    let queryKey = `${queryKeyName}(${schemas.pathParams?.name ? `${pathParams}, ` : ''}${schemas.queryParams?.name ? 'params' : ''})`

    if (framework === 'solid') {
      queryKey = `() => ${queryKey}`
    }
    if (framework === 'vue') {
      queryKey = `${queryKeyName}(${schemas.pathParams?.name ? `${pathParams}, ` : ''}${schemas.queryParams?.name ? 'refParams' : ''})`
    }

    codes.push(`
export function ${name} <${generics.join(', ')}>(${params}): ${frameworkImports.query.UseInfiniteQueryOptions}<${queryGenerics.join(', ')}> {
  const queryKey = ${queryKey};

  return {
    queryKey,
    queryFn: ({ pageParam }) => {
      ${unrefs}
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

    return { code: combineCodes(codes), name, imports: [] }
  }

  private get queryInfinite(): QueryResult {
    const { framework, frameworkImports, errors, operation, schemas, dataReturnType } = this.config
    const codes: string[] = []

    const queryKeyName = this.queryKey.name
    const queryOptionsName = this.queryOptionsInfinite.name // changed
    const name = `${frameworkImports.getName(operation)}Infinite`
    const pathParams = getParams(schemas.pathParams, {
      override: framework === 'vue' ? (item) => ({ ...item, name: `ref${pascalCase(item.name)}` }) : undefined,
    })
    const comments = getComments(operation)

    const generics = [`TData = ${schemas.response.name}`, `TError = ${errors.map((error) => error.name).join(' | ') || 'unknown'}`]
    const clientGenerics = ['TData', 'TError']
    const queryGenerics = [dataReturnType === 'data' ? 'TData' : 'ResponseConfig<TData>', 'TError']
    const params = createFunctionParams([
      ...getDataParams(schemas.pathParams, {
        typed: true,
        override: framework === 'vue' ? (item) => ({ ...item, name: `ref${pascalCase(item.name)}`, type: `MaybeRef<${item.type}>` }) : undefined,
      }),
      {
        name: framework === 'vue' ? 'refParams' : 'params',
        type: framework === 'vue' && schemas.queryParams?.name ? `MaybeRef<${schemas.queryParams?.name}>` : schemas.queryParams?.name,
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
        type: `{ 
          query?: ${frameworkImports.query.UseInfiniteQueryOptions}<${queryGenerics.join(', ')}>,
          client?: Partial<Parameters<typeof client<${clientGenerics.filter((generic) => generic !== 'unknown').join(', ')}>>[0]>,
        }`,
        default: '{}',
      },
    ])

    const queryKey = `${queryKeyName}(${schemas.pathParams?.name ? `${pathParams}, ` : ''}${
      schemas.queryParams?.name ? (framework === 'vue' ? 'refParams' : 'params') : ''
    })`
    const queryParams = createFunctionParams([
      ...getDataParams(schemas.pathParams, {
        typed: false,
        override: framework === 'vue' ? (item) => ({ ...item, name: `ref${pascalCase(item.name)}` }) : undefined,
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

    return { code: combineCodes(codes), name, imports: [] }
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
    const paramsData = [
      ...getDataParams(schemas.pathParams, {
        typed: true,
        override: framework === 'vue' ? (item) => ({ ...item, name: `ref${pascalCase(item.name)}`, type: `MaybeRef<${item.type}>` }) : undefined,
      }),
      {
        name: framework === 'vue' ? 'refParams' : 'params',
        type: framework === 'vue' && schemas.queryParams?.name ? `MaybeRef<${schemas.queryParams?.name}>` : schemas.queryParams?.name,
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
        type: `{
          mutation?: ${frameworkImports.mutate.UseMutationOptions}<${mutationGenerics.join(', ')}>,
          client?: Partial<Parameters<typeof client<${clientGenerics.filter((generic) => generic !== 'unknown').join(', ')}>>[0]>,
      }`,
        default: '{}',
      },
    ]
    const params = createFunctionParams(paramsData)

    const unrefs =
      framework === 'vue'
        ? paramsData
            .filter((item) => item.type?.startsWith('MaybeRef<'))
            .map((item) => {
              return `const ${camelCase(item.name.replace('ref', ''))} = unref(${item.name})`
            })
            .join('\n')
        : ''

    codes.push(createJSDocBlockText({ comments }))
    codes.push(`
export function ${name} <${generics.join(',')}>(${params}): ${frameworkImports.mutate.UseMutationResult}<${mutationGenerics.join(', ')}> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {};
  
  return ${frameworkImports.mutate.useMutation}<${mutationGenerics.join(', ')}>({
    mutationFn: (${schemas.request?.name ? 'data' : ''}) => {
      ${unrefs}
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

    return { code: combineCodes(codes), name, imports: [] }
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

  imports(): Import[] {
    return [...this.queryKey.imports]
  }
}
