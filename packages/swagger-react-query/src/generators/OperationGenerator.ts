import { camelCase, capitalCase } from 'change-case'

import type { PluginContext, File, FileManager } from '@kubb/core'
import { Generator, getRelativePath } from '@kubb/core'
import { createJSDocBlockText, pluginName as swaggerTypescriptPluginName } from '@kubb/swagger-typescript'

import { pluginName } from '../plugin'

import type { Operation } from 'oas'
import type { MediaTypeObject, RequestBodyObject } from 'oas/dist/rmoas.types'
import type Oas from 'oas'
import type { OpenAPIV3 } from 'openapi-types'

type Options = {
  oas: Oas
  directory: string
  fileManager: FileManager
  resolveId: PluginContext['resolveId']
}

export class OperationGenerator extends Generator<Options> {
  private getSchemas(operation: Operation) {
    // TODO create function to get schema out of paramaters
    const schemaOperationPathParams = operation.getParameters().filter((v) => v.in === 'path')
    const schemaOperationPathParamsSchema = schemaOperationPathParams.reduce(
      (schema, pathParameters) => {
        return {
          ...schema,
          required: [...schema.required!, pathParameters.required ? pathParameters.name : undefined].filter(Boolean) as string[],
          properties: {
            ...schema.properties,
            [pathParameters.name]: pathParameters.schema as OpenAPIV3.SchemaObject,
          },
        }
      },
      { type: 'object', required: [], properties: {} } as OpenAPIV3.SchemaObject
    )

    const schemaOperationQueryParams = operation.getParameters().filter((v) => v.in === 'query')
    const schemaOperationQueryParamsSchema = schemaOperationQueryParams.reduce(
      (schema, pathParameters) => {
        return {
          ...schema,
          required: [...schema.required!, pathParameters.required ? pathParameters.name : undefined].filter(Boolean) as string[],
          properties: {
            ...schema.properties,
            [pathParameters.name]: pathParameters.schema as OpenAPIV3.SchemaObject,
          },
        }
      },
      { type: 'object', required: [], properties: {} } as OpenAPIV3.SchemaObject
    )

    const data = {
      pathParams: operation.hasParameters()
        ? {
            name: capitalCase(`${operation.getOperationId()} "PathParams"`, { delimiter: '' }),
            schema: schemaOperationPathParamsSchema,
          }
        : undefined,
      queryParams: operation.hasParameters()
        ? {
            name: capitalCase(`${operation.getOperationId()} "QueryParams"`, { delimiter: '' }),
            schema: schemaOperationQueryParamsSchema,
          }
        : undefined,
      request: {
        name: capitalCase(`${operation.getOperationId()} "Request"`, { delimiter: '' }),
        description: (operation.schema.requestBody as RequestBodyObject)?.description,
        schema: (operation.getRequestBody('application/json') as MediaTypeObject)?.schema as OpenAPIV3.SchemaObject,
      },
      response: {
        name: capitalCase(`${operation.getOperationId()} "Response"`, { delimiter: '' }),
        description: operation.getResponseAsJSONSchema('200')?.at(0)?.description,
        schema: operation.getResponseAsJSONSchema('200')?.at(0)?.schema as OpenAPIV3.SchemaObject,
      },
    } as const
    return data
  }

  private getComments(operation: Operation) {
    return [
      operation.getDescription() && `@description ${operation.getDescription()}`,
      operation.getSummary() && `@summary ${operation.getSummary()}`,
      operation.path && `@link ${operation.path}`,
    ].filter(Boolean)
  }

  async getGet(path: string) {
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

    const typeName = `${capitalCase(operation.getOperationId(), { delimiter: '' })}.ts`
    const typeFilePath = await resolveId({ fileName: typeName, directory, pluginName: swaggerTypescriptPluginName })

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

      pathParamsTyped = Object.entries(schemas.pathParams.schema.properties!)
        .reduce((acc, [key, value], index, arr) => {
          acc.push(`${key}: ${schemas.pathParams!.name}["${key}"], `)

          return acc
        }, [] as string[])
        .join('')
      pathParams = Object.entries(schemas.pathParams.schema.properties!)
        .reduce((acc, [key, value], index, arr) => {
          acc.push(`${key},`)

          return acc
        }, [] as string[])
        .join('')
    }

    if (schemas.queryParams && !schemas.pathParams) {
      sources.push(`
        export const ${queryKey} = (params?: ${schemas.queryParams.name}) => [\`${url}\`, ...(params ? [params] : [])] as const;
      `)

      sources.push(`
        ${createJSDocBlockText({ comments })}
        export const ${hookName} = <TData = ${schemas.response.name}>(params: ${
        schemas.queryParams.name
      }, options?: { query?: UseQueryOptions<TData> }): UseQueryResult<TData> & { queryKey: QueryKey } => {
          const { query: queryOptions } = options ?? {};
          const queryKey = queryOptions?.queryKey ?? ${queryKey}(params);
          
          const query = useQuery<TData>({
            queryKey,
            queryFn: () => {
              return axios
                .get(\`${url}\`)
                .then((res) => res.data);
            },
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
        ${createJSDocBlockText({ comments })}
        export const ${hookName} = <TData = ${schemas.response.name}>(${pathParamsTyped}
      }, options?: { query?: UseQueryOptions<TData> }): UseQueryResult<TData> & { queryKey: QueryKey } => {
          const { query: queryOptions } = options ?? {};
          const queryKey = queryOptions?.queryKey ?? ${queryKey}(${pathParams});
          
          const query = useQuery<TData>({
            queryKey,
            queryFn: () => {
              return axios
                .get(\`${url}\`)
                .then((res) => res.data);
            },
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
        ${createJSDocBlockText({ comments })}
        export const ${hookName} = <TData = ${schemas.response.name}>(${pathParamsTyped} params: ${
        schemas.queryParams.name
      }, options?: { query?: UseQueryOptions<TData> }): UseQueryResult<TData> & { queryKey: QueryKey } => {
          const { query: queryOptions } = options ?? {};
          const queryKey = queryOptions?.queryKey ?? ${queryKey}(${pathParams} params);
          
          const query = useQuery<TData>({
            queryKey,
            queryFn: () => {
              return axios
                .get(\`${url}\`)
                .then((res) => res.data);
            },
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
        ${createJSDocBlockText({ comments })}
        export const ${hookName} = <TData = ${
        schemas.response.name
      }>(options?: { query?: UseQueryOptions<TData> }): UseQueryResult<TData> & { queryKey: QueryKey } => {
          const { query: queryOptions } = options ?? {};
          const queryKey = queryOptions?.queryKey ?? ${queryKey}();

          const query = useQuery<TData>({
            queryKey,
            queryFn: () => {
              return axios
                .get(\`${url}\`)
                .then((res) => res.data)
            },
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
          name: ['useQuery', 'QueryKey', 'UseQueryResult', 'UseQueryOptions'],
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

  async getPost(path: string) {
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

    const typeName = `${capitalCase(operation.getOperationId(), { delimiter: '' })}.ts`
    const typeFilePath = await resolveId({ fileName: typeName, directory, pluginName: swaggerTypescriptPluginName })

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

  async getPut(path: string) {
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

    const typeName = `${capitalCase(operation.getOperationId(), { delimiter: '' })}.ts`
    const typeFilePath = await resolveId({ fileName: typeName, directory, pluginName: swaggerTypescriptPluginName })

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

  async getDelete(path: string) {
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

    const typeName = `${capitalCase(operation.getOperationId(), { delimiter: '' })}.ts`
    const typeFilePath = await resolveId({ fileName: typeName, directory, pluginName: swaggerTypescriptPluginName })

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
    const { oas, fileManager } = this.options
    const paths = oas.getPaths()
    const promises: Promise<File | null>[] = []
    const filePromises: Promise<File>[] = []

    Object.keys(paths).forEach((path) => {
      promises.push(this.getGet(path))
      promises.push(this.getPost(path))
      promises.push(this.getPut(path))
      promises.push(this.getDelete(path))
    })

    const files = await Promise.all(promises).then((files) => {
      return fileManager.combine(files)
    })

    files.forEach((file) => {
      filePromises.push(fileManager.addOrAppend(file))
    })
    return Promise.all(filePromises)
  }
}
