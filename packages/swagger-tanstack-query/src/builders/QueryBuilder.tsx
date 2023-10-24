/* eslint- @typescript-eslint/explicit-module-boundary-types */
import { createJSDocBlockText, FunctionParams, PackageManager, transformers, URLPath } from '@kubb/core'
import { createRoot, File } from '@kubb/react'
import { getASTParams, getComments, getParams, OasBuilder, useResolve } from '@kubb/swagger'

import { camelCase, pascalCase } from 'change-case'

import { QueryKeyFunction } from '../components/index.ts'

import type { AppContextProps, RootType } from '@kubb/react'
import type { Resolver } from '@kubb/swagger'
import type { AppMeta, Framework, FrameworkImports, Options as PluginOptions } from '../types.ts'

type BaseOptions = {
  dataReturnType: PluginOptions['dataReturnType']
  framework: Framework
  frameworkImports: FrameworkImports
  errors: Resolver[]
}

type QueryOptions = BaseOptions & {
  infinite?: PluginOptions['infinite']
}

type MutationOptions = BaseOptions
type Options = QueryOptions | MutationOptions

type QueryResult = { code: string; name: string }

export class QueryBuilder extends OasBuilder<Options> {
  get queryKey(): { name: string; Component: React.ElementType } {
    const { framework } = this.options
    const { operation } = this.context

    const name = camelCase(`${operation.getOperationId()}QueryKey`)
    const FrameworkComponent = QueryKeyFunction[framework]

    const Component = () => <FrameworkComponent name={name} />

    return { name, Component }
  }

  get queryOptions(): QueryResult {
    const { framework, frameworkImports, errors, dataReturnType } = this.options
    const { operation, schemas } = this.context

    const codes: string[] = []

    const name = camelCase(`${operation.getOperationId()}QueryOptions`)
    const queryKeyName = this.queryKey.name

    const pathParams = getParams(schemas.pathParams, {
      override: framework === 'vue' ? (item) => ({ ...item, name: item.name ? `ref${pascalCase(item.name)}` : undefined }) : undefined,
    }).toString()

    const generics = new FunctionParams()
    const params = new FunctionParams()

    generics.add([
      { type: 'TData', default: schemas.response.name },
      { type: 'TError', default: errors.map((error) => error.name).join(' | ') || 'unknown' },
    ])

    const clientGenerics = ['TData', 'TError']
    const queryGenerics = [dataReturnType === 'data' ? 'TData' : 'ResponseConfig<TData>', 'TError']
    const paramsData = [
      ...getASTParams(schemas.pathParams, {
        typed: true,
        override: framework === 'vue'
          ? (item) => ({ ...item, name: item.name ? `ref${pascalCase(item.name)}` : undefined, type: `MaybeRef<${item.type}>` })
          : undefined,
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
    params.add(paramsData)

    const unrefs = framework === 'vue'
      ? paramsData
        .filter((item) => item.type?.startsWith('MaybeRef<'))
        .map((item) => {
          return item.name ? `const ${camelCase(item.name.replace('ref', ''))} = unref(${item.name})` : undefined
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

    if (frameworkImports.isV5 && frameworkImports.query.queryOptions) {
      codes.push(`
      export function ${name} <${generics.toString()}>(${params.toString()}): ${frameworkImports.query.UseQueryOptions}<${queryGenerics.join(', ')}> {
        const queryKey = ${queryKey};

        return ${frameworkImports.query.queryOptions}<${queryGenerics.join(', ')}>({
          queryKey: queryKey as QueryKey,
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
        });
      };
      `)
    } else {
      // v4
      codes.push(`
      export function ${name} <${generics.toString()}>(${params.toString()}): ${frameworkImports.query.UseQueryOptions}<${queryGenerics.join(', ')}> {
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
    }

    return { code: transformers.combineCodes(codes), name }
  }

  get query(): QueryResult {
    const { framework, frameworkImports, errors, dataReturnType } = this.options
    const { operation, schemas } = this.context

    const codes: string[] = []

    const queryKeyName = this.queryKey.name
    const queryOptionsName = this.queryOptions.name
    const name = frameworkImports.getName(operation)
    const pathParams = getParams(schemas.pathParams, {
      override: framework === 'vue' ? (item) => ({ ...item, name: item.name ? `ref${pascalCase(item.name)}` : undefined }) : undefined,
    }).toString()
    const comments = getComments(operation)

    const generics = new FunctionParams()
    const params = new FunctionParams()
    const queryParams = new FunctionParams()

    generics.add([
      { type: 'TData', default: schemas.response.name },
      { type: 'TError', default: errors.map((error) => error.name).join(' | ') || 'unknown' },
    ])

    const clientGenerics = ['TData', 'TError']
    const queryGenerics = [dataReturnType === 'data' ? 'TData' : 'ResponseConfig<TData>', 'TError']
    params.add([
      ...getASTParams(schemas.pathParams, {
        typed: true,
        override: framework === 'vue'
          ? (item) => ({ ...item, name: item.name ? `ref${pascalCase(item.name)}` : undefined, type: `MaybeRef<${item.type}>` })
          : undefined,
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
          query?: ${frameworkImports.isV5 ? frameworkImports.query.QueryObserverOptions : frameworkImports.query.UseQueryOptions}<${queryGenerics.join(', ')}>,
          client?: Partial<Parameters<typeof client<${clientGenerics.filter((generic) => generic !== 'unknown').join(', ')}>>[0]>,
        }`,
        default: '{}',
      },
    ])

    const queryKey = `${queryKeyName}(${schemas.pathParams?.name ? `${pathParams}, ` : ''}${
      schemas.queryParams?.name ? (framework === 'vue' ? 'refParams' : 'params') : ''
    })`
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
    const queryOptions = `${queryOptionsName}<${clientGenerics.join(', ')}>(${queryParams.toString()})`

    codes.push(createJSDocBlockText({ comments }))
    codes.push(`
export function ${name} <${generics.toString()}>(${params.toString()}): ${frameworkImports.query.UseQueryResult}<${
      queryGenerics.join(
        ', ',
      )
    }> & { queryKey: QueryKey } {
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

    return { code: transformers.combineCodes(codes), name }
  }

  // infinite
  get queryOptionsInfinite(): QueryResult {
    const { framework, frameworkImports, errors, infinite: { queryParam = 'id', initialPageParam = 0 } = {}, dataReturnType } = this.options as QueryOptions
    const { operation, schemas } = this.context

    const codes: string[] = []

    const name = camelCase(`${operation.getOperationId()}QueryOptionsInfinite`)
    const queryKeyName = this.queryKey.name

    const pathParams = getParams(schemas.pathParams, {
      override: framework === 'vue' ? (item) => ({ ...item, name: item.name ? `ref${pascalCase(item.name)}` : undefined }) : undefined,
    }).toString()

    const generics = new FunctionParams()
    const params = new FunctionParams()

    generics.add([
      { type: 'TData', default: schemas.response.name },
      { type: 'TError', default: errors.map((error) => error.name).join(' | ') || 'unknown' },
      {
        type: 'TInfiniteDate',
        // TODO move extends [] to it's own kubb type
        default: `${frameworkImports.query.InfiniteData}<${schemas.response.name} extends [] ? ${schemas.response.name}[number] : ${schemas.response.name}>`,
        enabled: frameworkImports.isV5 && !!frameworkImports.query.InfiniteData,
      },
    ])

    const clientGenerics = ['TData', 'TError']
    const queryGenerics = [
      dataReturnType === 'data' ? 'TData' : 'ResponseConfig<TData>',
      'TError',
      frameworkImports.isV5 && !!frameworkImports.query.InfiniteData ? 'TInfiniteDate' : undefined,
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
    params.add(paramsData)

    const unrefs = framework === 'vue'
      ? paramsData
        .filter((item) => item.type?.startsWith('MaybeRef<'))
        .map((item) => {
          return item.name ? `const ${camelCase(item.name.replace('ref', ''))} = unref(${item.name})` : undefined
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

    if (frameworkImports.isV5) {
      if (initialPageParam === undefined) {
        // TODO check if really needed
        throw new Error('When using `@tanstack-query` and infinite you need to set `initialPageParam`')
      }

      codes.push(`
      export function ${name} <${generics.toString()}>(${params.toString()}): ${frameworkImports.query.UseInfiniteQueryOptions}<${queryGenerics.join(', ')}> {
        const queryKey = ${queryKey};

        return ${frameworkImports.query.infiniteQueryOptions}<${queryGenerics.join(', ')}>({
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
          initialPageParam: ${initialPageParam},
          getNextPageParam: (lastPage) => lastPage['${queryParam}'],
        });
      };
      `)
    } else {
      codes.push(`
      export function ${name} <${generics.toString()}>(${params.toString()}): ${frameworkImports.query.UseInfiniteQueryOptions}<${queryGenerics.join(', ')}> {
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
    }

    return { code: transformers.combineCodes(codes), name }
  }

  get queryInfinite(): QueryResult {
    const { framework, frameworkImports, errors, dataReturnType } = this.options
    const { operation, schemas } = this.context

    const codes: string[] = []

    const queryKeyName = this.queryKey.name
    const queryOptionsName = this.queryOptionsInfinite.name // changed
    const name = `${frameworkImports.getName(operation)}Infinite`
    const pathParams = getParams(schemas.pathParams, {
      override: framework === 'vue' ? (item) => ({ ...item, name: item.name ? `ref${pascalCase(item.name)}` : undefined }) : undefined,
    }).toString()
    const comments = getComments(operation)

    const generics = new FunctionParams()
    const params = new FunctionParams()
    const queryParams = new FunctionParams()

    generics.add([
      { type: 'TData', default: schemas.response.name },
      { type: 'TError', default: errors.map((error) => error.name).join(' | ') || 'unknown' },
      {
        type: 'TInfiniteDate',
        // TODO move extends [] to it's own kubb type
        default: `${frameworkImports.query.InfiniteData}<${schemas.response.name} extends [] ? ${schemas.response.name}[number] : ${schemas.response.name}>`,
        enabled: frameworkImports.isV5 && !!frameworkImports.query.InfiniteData,
      },
    ])

    const clientGenerics = ['TData', 'TError']
    const queryGenerics = [
      dataReturnType === 'data' ? 'TData' : 'ResponseConfig<TData>',
      'TError',
      frameworkImports.isV5 && !!frameworkImports.query.InfiniteData ? 'TInfiniteDate' : undefined,
    ].filter(Boolean)

    const queryResultGenerics = [
      dataReturnType === 'data' ? 'TData' : 'ResponseConfig<TData>',
      'TError',
    ]
    const queryOptionsGenerics = ['TData', 'TError', frameworkImports.isV5 && !!frameworkImports.query.InfiniteData ? 'TInfiniteDate' : undefined].filter(
      Boolean,
    )

    params.add([
      ...getASTParams(schemas.pathParams, {
        typed: true,
        override: framework === 'vue'
          ? (item) => ({ ...item, name: item.name ? `ref${pascalCase(item.name)}` : undefined, type: `MaybeRef<${item.type}>` })
          : undefined,
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
          query?: ${frameworkImports.isV5 ? frameworkImports.query.InfiniteQueryObserverOptions : frameworkImports.query.UseInfiniteQueryOptions}<${
          queryGenerics.join(', ')
        }>,
          client?: Partial<Parameters<typeof client<${clientGenerics.filter((generic) => generic !== 'unknown').join(', ')}>>[0]>,
        }`,
        default: '{}',
      },
    ])

    const queryKey = `${queryKeyName}(${schemas.pathParams?.name ? `${pathParams}, ` : ''}${
      schemas.queryParams?.name ? (framework === 'vue' ? 'refParams' : 'params') : ''
    })`
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
    const queryOptions = `${queryOptionsName}<${queryOptionsGenerics.join(', ')}>(${queryParams.toString()})`

    codes.push(createJSDocBlockText({ comments }))

    codes.push(`
export function ${name} <${generics.toString()}>(${params.toString()}): ${frameworkImports.query.UseInfiniteQueryResult}<${
      queryResultGenerics.join(
        ', ',
      )
    }> & { queryKey: QueryKey } {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {};
  const queryKey = queryOptions?.queryKey${framework === 'solid' ? `?.()` : ''} ?? ${queryKey};

  const query = ${frameworkImports.query.useInfiniteQuery}<${queryGenerics.join(', ')}>({
    ...${queryOptions},
    ...queryOptions
  }) as ${frameworkImports.query.UseInfiniteQueryResult}<${queryResultGenerics.join(', ')}> & { queryKey: QueryKey };

  query.queryKey = queryKey as QueryKey;

  return query;
};
`)

    return { code: transformers.combineCodes(codes), name }
  }

  get mutation(): QueryResult {
    const { framework, frameworkImports, errors } = this.options as MutationOptions
    const { operation, schemas } = this.context

    const codes: string[] = []

    const name = frameworkImports.getName(operation)

    const comments = getComments(operation)
    const method = operation.method

    const generics = new FunctionParams()
    const params = new FunctionParams()

    generics.add([
      { type: 'TData', default: schemas.response.name },
      { type: 'TError', default: errors.map((error) => error.name).join(' | ') || 'unknown' },
      { type: 'TVariables', default: schemas.request?.name, enabled: !!schemas.request?.name },
    ])

    const clientGenerics = ['TData', 'TError', schemas.request?.name ? `TVariables` : 'void', framework === 'vue' ? 'unknown' : undefined].filter(Boolean)
    const mutationGenerics = [
      'ResponseConfig<TData>',
      'TError',
      schemas.request?.name ? `TVariables` : 'void',
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
    params.add(paramsData)

    const unrefs = framework === 'vue'
      ? paramsData
        .filter((item) => item.type?.startsWith('MaybeRef<'))
        .map((item) => {
          return item.name ? `const ${camelCase(item.name.replace('ref', ''))} = unref(${item.name})` : undefined
        })
        .join('\n')
      : ''

    codes.push(createJSDocBlockText({ comments }))
    codes.push(`
export function ${name} <${generics.toString()}>(${params.toString()}): ${frameworkImports.mutate.UseMutationResult}<${mutationGenerics.join(', ')}> {
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

    return { code: transformers.combineCodes(codes), name }
  }

  print(type: 'query' | 'mutation', name: string): string {
    return this.render(type, name).output
  }

  render(type: 'query' | 'mutation', name: string): RootType<AppContextProps<AppMeta>> {
    const { infinite } = this.options as QueryOptions
    const { pluginManager, operation, schemas, plugin } = this.context

    const { Component: QueryKey } = this.queryKey

    const root = createRoot<AppContextProps<AppMeta>>()

    const ComponentQuery = () => {
      const file = useResolve({ name, pluginKey: plugin.key, type: 'file' })

      return (
        <File baseName={file.baseName} path={file.path}>
          <File.Source>
            <QueryKey />
            {this.queryOptions.code}
            <br />
            {this.query.code}
          </File.Source>
        </File>
      )
    }

    const ComponentQueryInfinite = () => {
      const file = useResolve({ name, pluginKey: plugin.key, type: 'file' })

      return (
        <File baseName={file.baseName} path={file.path}>
          <File.Source>
            <QueryKey />
            {this.queryOptions.code}
            <br />
            {this.query.code}
            <br />
            {this.queryOptionsInfinite.code}
            <br />
            {this.queryInfinite.code}
          </File.Source>
        </File>
      )
    }

    const ComponentMutation = () => {
      const file = useResolve({ name, pluginKey: plugin.key, type: 'file' })

      return (
        <File baseName={file.baseName} path={file.path}>
          <File.Source>{this.mutation.code}</File.Source>
        </File>
      )
    }

    if (type === 'query') {
      if (infinite) {
        root.render(<ComponentQueryInfinite />, { meta: { pluginManager, schemas, operation } })
      } else {
        root.render(<ComponentQuery />, { meta: { pluginManager, schemas, operation } })
      }
    }
    if (type === 'mutation') {
      root.render(<ComponentMutation />, { meta: { pluginManager, schemas, operation } })
    }

    return root
  }
}
