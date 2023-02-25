import { pascalCase, camelCase } from 'change-case'

import type { PluginContext, File, FileManager } from '@kubb/core'
import { getRelativePath, objectToParameters, createJSDocBlockText } from '@kubb/core'
import { pluginName as SwaggerTSPluginName } from '@kubb/swagger-ts'
import { OperationGenerator as Generator } from '@kubb/swagger'
import type { Oas } from '@kubb/swagger'

import { pluginName } from '../plugin'

type Options = {
  oas: Oas
  directory: string
  fileManager: FileManager
  resolveId: PluginContext['resolveId']
}

export class OperationGenerator extends Generator<Options> {
  async getGet(path: string): Promise<File | null> {
    const { oas, directory, resolveId } = this.options

    const operation = oas.operation(path, 'get')

    if (!operation.schema.operationId) return null

    // hook setup
    const hookName = `${camelCase(`use ${operation.getOperationId()}`)}`
    const hookId = `${hookName}.ts`
    const hookFilePath = await resolveId({
      fileName: hookId,
      directory,
      pluginName,
    })

    if (!hookFilePath) {
      return null
    }
    // end hook setup

    // type creation

    const schemas = this.getSchemas(operation)

    const typeName = `${pascalCase(operation.getOperationId(), { delimiter: '' })}.ts`
    const typeFilePath = await resolveId({ fileName: typeName, directory, pluginName: SwaggerTSPluginName })

    // hook creation

    const comments = this.getComments(operation)
    const sources: string[] = []
    const queryKey = `${camelCase(`${operation.getOperationId()}QueryKey`)}`
    let url = operation.path
    let pathParamsTyped = ''
    let pathParams = ''

    if (schemas.pathParams) {
      // TODO move to it's own function(utils)
      url = url.replaceAll('{', '${')

      const data = Object.entries(schemas.pathParams.schema.properties!).map((item) => {
        return [item[0], schemas.pathParams!.name]
      })

      pathParamsTyped = objectToParameters(data, { typed: true })
      pathParams = objectToParameters(data)
    }

    if (schemas.queryParams && !schemas.pathParams) {
      sources.push(`
        export const ${queryKey} = (params?: ${schemas.queryParams.name}) => [\`${url}\`, ...(params ? [params] : [])] as const;
      `)

      sources.push(`
        export const ${camelCase(`${operation.getOperationId()}QueryOptions`)} = <TData = ${schemas.response.name}>(params: ${
        schemas.queryParams.name
      }): QueryOptions<TData> => {
          const queryKey = ${queryKey}(params);

          return {
            queryKey,
            queryFn: () => {
              return axios
                .get(\`${url}\`)
                .then((res) => res.data);
            },
          };
        };
      `)

      sources.push(`
        ${createJSDocBlockText({ comments })}
        export const ${hookName} = <TData = ${schemas.response.name}>(params?: ${
        schemas.queryParams.name
      }, options?: { query?: UseQueryOptions<TData> }): UseQueryResult<TData> & { queryKey: QueryKey } => {
          const { query: queryOptions } = options ?? {};
          const queryKey = queryOptions?.queryKey ?? ${queryKey}(params);
          
          const query = useQuery<TData>({
            ...${camelCase(`${operation.getOperationId()}QueryOptions`)}(params),
            ...queryOptions
          }) as UseQueryResult<TData> & { queryKey: QueryKey };

          query.queryKey = queryKey;

          return query;
        };
      `)
    }

    if (!schemas.queryParams && schemas.pathParams) {
      sources.push(`
        export const ${queryKey} = (${pathParamsTyped}) => [\`${url}\`] as const;
      `)

      sources.push(`
        export const ${camelCase(`${operation.getOperationId()}QueryOptions`)} = <TData = ${
        schemas.response.name
      }>(${pathParamsTyped}): QueryOptions<TData> => {
          const queryKey = ${queryKey}(${pathParams});

          return {
            queryKey,
            queryFn: () => {
              return axios
                .get(\`${url}\`)
                .then((res) => res.data);
            },
          };
        };
      `)

      sources.push(`
        ${createJSDocBlockText({ comments })}
        export const ${hookName} = <TData = ${schemas.response.name}>(${pathParamsTyped}
      }, options?: { query?: UseQueryOptions<TData> }): UseQueryResult<TData> & { queryKey: QueryKey } => {
          const { query: queryOptions } = options ?? {};
          const queryKey = queryOptions?.queryKey ?? ${queryKey}(${pathParams});
          
          const query = useQuery<TData>({
            ...${camelCase(`${operation.getOperationId()}QueryOptions`)}<TData>(${pathParams}),
            ...queryOptions
          }) as UseQueryResult<TData> & { queryKey: QueryKey };

          query.queryKey = queryKey;

          return query;
        };
      `)
    }

    if (schemas.queryParams && schemas.pathParams) {
      sources.push(`
        export const ${queryKey} = (${pathParamsTyped} params?: ${schemas.queryParams.name}) => [\`${url}\`, ...(params ? [params] : [])] as const;
      `)

      sources.push(`
        export const ${camelCase(`${operation.getOperationId()}QueryOptions`)} = <TData = ${schemas.response.name}>(${pathParamsTyped} params?: ${
        schemas.queryParams.name
      }): QueryOptions<TData> => {
          const queryKey = ${queryKey}(${pathParams} params);

          return {
            queryKey,
            queryFn: () => {
              return axios
                .get(\`${url}\`)
                .then((res) => res.data);
            },
          };
        };
      `)

      sources.push(`
        ${createJSDocBlockText({ comments })}
        export const ${hookName} = <TData = ${schemas.response.name}>(${pathParamsTyped} params?: ${
        schemas.queryParams.name
      }, options?: { query?: UseQueryOptions<TData> }): UseQueryResult<TData> & { queryKey: QueryKey } => {
          const { query: queryOptions } = options ?? {};
          const queryKey = queryOptions?.queryKey ?? ${queryKey}(${pathParams} params);
          
          const query = useQuery<TData>({
            ...${camelCase(`${operation.getOperationId()}QueryOptions`)}<TData>(${pathParams} params),
            ...queryOptions
          }) as UseQueryResult<TData> & { queryKey: QueryKey };

          query.queryKey = queryKey;

          return query;
        };
      `)
    }

    if (!schemas.queryParams && !schemas.pathParams) {
      sources.push(`
        export const ${queryKey} = () => [\`${url}\`] as const;
      `)

      sources.push(`
      export const ${camelCase(`${operation.getOperationId()}QueryOptions`)} = <TData = ${schemas.response.name}>(): QueryOptions<TData> => {
        const queryKey = ${queryKey}();

        return {
          queryKey,
          queryFn: () => {
            return axios
              .get(\`${url}\`)
              .then((res) => res.data);
          },
        };
      };
    `)

      sources.push(`
        ${createJSDocBlockText({ comments })}
        export const ${hookName} = <TData = ${
        schemas.response.name
      }>(options?: { query?: UseQueryOptions<TData> }): UseQueryResult<TData> & { queryKey: QueryKey } => {
          const { query: queryOptions } = options ?? {};
          const queryKey = queryOptions?.queryKey ?? ${queryKey}();

          const query = useQuery<TData>({
            ...${camelCase(`${operation.getOperationId()}QueryOptions`)}<TData>(),
            ...queryOptions
          }) as UseQueryResult<TData> & { queryKey: QueryKey };

          query.queryKey = queryKey;

          return query;
        };
      `)
    }

    return {
      path: hookFilePath,
      fileName: hookId,
      source: sources.join('\n'),
      imports: [
        {
          name: ['useQuery', 'QueryKey', 'UseQueryResult', 'UseQueryOptions', 'QueryOptions'],
          path: '@tanstack/react-query',
        },
        {
          name: 'axios',
          path: 'axios',
        },
        {
          name: [schemas.response.name, schemas.pathParams?.name, schemas.queryParams?.name].filter(Boolean) as string[],
          path: getRelativePath(hookFilePath, typeFilePath),
          isTypeOnly: true,
        },
      ],
    }
  }

  async getPost(path: string): Promise<File | null> {
    const { oas, directory, resolveId } = this.options

    const operation = oas.operation(path, 'post')

    if (!operation.schema.operationId) return null

    // hook setup
    const hookName = `${camelCase(`use ${operation.getOperationId()}`)}`
    const hookId = `${hookName}.ts`
    const hookFilePath = await resolveId({ fileName: hookId, directory, pluginName })
    if (!hookFilePath) {
      return null
    }
    // end hook setup

    // type creation

    const schemas = this.getSchemas(operation)

    const typeName = `${pascalCase(operation.getOperationId(), { delimiter: '' })}.ts`
    const typeFilePath = await resolveId({ fileName: typeName, directory, pluginName: SwaggerTSPluginName })

    // hook creation

    const comments = this.getComments(operation)

    let url = operation.path
    let pathParamsTyped = ''

    if (schemas.pathParams) {
      // TODO move to it's own function(utils)
      url = url.replaceAll('{', '${')

      pathParamsTyped = Object.entries(schemas.pathParams.schema.properties!)
        .reduce((acc, [key, value], index, arr) => {
          acc.push(`${key}: ${schemas.pathParams!.name}["${key}"], `)

          return acc
        }, [] as string[])
        .join('')
    }

    const source = `
        ${createJSDocBlockText({ comments })}
        export const ${hookName} = <TData = ${schemas.response.name}, TVariables = ${schemas.request.name}>(${pathParamsTyped} options?: {
          mutation?: UseMutationOptions<TData, unknown, TVariables>
        }) => {
          const { mutation: mutationOptions } = options ?? {};

          return useMutation<TData, unknown, TVariables>({
            mutationFn: (data) => {
              return axios
              .post(\`${url}\`, data)
              .then((res) => res.data)
            },
            ...mutationOptions
          });
        };
    `

    return {
      path: hookFilePath,
      fileName: hookId,
      source,
      imports: [
        {
          name: ['useMutation', 'UseMutationOptions'],
          path: '@tanstack/react-query',
        },
        {
          name: 'axios',
          path: 'axios',
        },
        {
          name: [schemas.request.name, schemas.response.name, schemas.pathParams?.name, schemas.queryParams?.name].filter(Boolean) as string[],
          path: getRelativePath(hookFilePath, typeFilePath),
          isTypeOnly: true,
        },
      ],
    }

    // end hook creation
  }

  async getPut(path: string): Promise<File | null> {
    const { oas, directory, resolveId } = this.options

    const operation = oas.operation(path, 'put')

    if (!operation.schema.operationId) return null

    // hook setup
    const hookName = `${camelCase(`use ${operation.getOperationId()}`)}`
    const hookId = `${hookName}.ts`
    const hookFilePath = await resolveId({ fileName: hookId, directory, pluginName })
    if (!hookFilePath) {
      return null
    }
    // end hook setup

    // type creation

    const schemas = this.getSchemas(operation)

    const typeName = `${pascalCase(operation.getOperationId(), { delimiter: '' })}.ts`
    const typeFilePath = await resolveId({ fileName: typeName, directory, pluginName: SwaggerTSPluginName })

    // hook creation

    const comments = this.getComments(operation)

    let url = operation.path
    let pathParamsTyped = ''

    if (schemas.pathParams) {
      // TODO move to it's own function(utils)
      url = url.replaceAll('{', '${')

      pathParamsTyped = Object.entries(schemas.pathParams.schema.properties!)
        .reduce((acc, [key, value], index, arr) => {
          acc.push(`${key}: ${schemas.pathParams!.name}["${key}"], `)

          return acc
        }, [] as string[])
        .join('')
    }

    const source = `
        ${createJSDocBlockText({ comments })}
        export const ${hookName} = <TData = ${schemas.response.name}, TVariables = ${schemas.request.name}>(${pathParamsTyped} options?: {
          mutation?: UseMutationOptions<TData, unknown, TVariables>
        }) => {
          const { mutation: mutationOptions } = options ?? {};

          return useMutation<TData, unknown, TVariables>({
            mutationFn: (data) => {
              return axios
              .put(\`${url}\`, data)
              .then((res) => res.data)
            },
            ...mutationOptions
          });
        };
    `

    return {
      path: hookFilePath,
      fileName: hookId,
      source,
      imports: [
        {
          name: ['useMutation', 'UseMutationOptions'],
          path: '@tanstack/react-query',
        },
        {
          name: 'axios',
          path: 'axios',
        },
        {
          name: [schemas.request.name, schemas.response.name, schemas.pathParams?.name, schemas.queryParams?.name].filter(Boolean) as string[],
          path: getRelativePath(hookFilePath, typeFilePath),
          isTypeOnly: true,
        },
      ],
    }

    // end hook creation
  }

  async getDelete(path: string): Promise<File | null> {
    const { oas, directory, resolveId } = this.options

    const operation = oas.operation(path, 'delete')

    if (!operation.schema.operationId) return null

    // hook setup
    const hookName = `${camelCase(`use ${operation.getOperationId()}`)}`
    const hookId = `${hookName}.ts`
    const hookFilePath = await resolveId({ fileName: hookId, directory, pluginName })
    if (!hookFilePath) {
      return null
    }
    // end hook setup

    // type creation

    const schemas = this.getSchemas(operation)

    const typeName = `${pascalCase(operation.getOperationId(), { delimiter: '' })}.ts`
    const typeFilePath = await resolveId({ fileName: typeName, directory, pluginName: SwaggerTSPluginName })

    // hook creation

    const comments = this.getComments(operation)

    let url = operation.path
    let pathParamsTyped = ''

    if (schemas.pathParams) {
      // TODO move to it's own function(utils)
      url = url.replaceAll('{', '${')

      pathParamsTyped = Object.entries(schemas.pathParams.schema.properties!)
        .reduce((acc, [key, value], index, arr) => {
          acc.push(`${key}: ${schemas.pathParams!.name}["${key}"], `)

          return acc
        }, [] as string[])
        .join('')
    }

    const source = `
        ${createJSDocBlockText({ comments })}
        export const ${hookName} = <TData = ${schemas.response.name}, TVariables = ${schemas.request.name}>(${pathParamsTyped} options?: {
          mutation?: UseMutationOptions<TData, unknown, TVariables>
        }) => {
          const { mutation: mutationOptions } = options ?? {};

          return useMutation<TData, unknown, TVariables>({
            mutationFn: (data) => {
              return axios
              .delete(\`${url}\`)
              .then((res) => res.data)
            },
            ...mutationOptions
          });
        };
    `

    return {
      path: hookFilePath,
      fileName: hookId,
      source,
      imports: [
        {
          name: ['useMutation', 'UseMutationOptions'],
          path: '@tanstack/react-query',
        },
        {
          name: 'axios',
          path: 'axios',
        },
        {
          name: [schemas.request.name, schemas.response.name, schemas.pathParams?.name, schemas.queryParams?.name].filter(Boolean) as string[],
          path: getRelativePath(hookFilePath, typeFilePath),
          isTypeOnly: true,
        },
      ],
    }

    // end hook creation
  }

  async build() {
    return this.buildOperations({
      fileManager: this.options.fileManager,
      oas: this.options.oas,
    })
  }
}
