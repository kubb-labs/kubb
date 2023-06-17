import { createJSDocBlockText, getRelativePath, URLPath } from '@kubb/core'
import { OperationGenerator as Generator, getComments, getParams } from '@kubb/swagger'
import { pluginName as swaggerTypescriptPluginName } from '@kubb/swagger-ts'

import { camelCase } from 'change-case'

import { pluginName } from '../plugin.ts'

import type { File, OptionalPath, PluginContext } from '@kubb/core'
import type { Oas, Operation, OperationSchemas, Resolver } from '@kubb/swagger'
import type { ResolvePathOptions } from '../types.ts'

type Options = {
  clientPath?: OptionalPath
  oas: Oas
  resolvePath: PluginContext<ResolvePathOptions>['resolvePath']
  resolveName: PluginContext['resolveName']
}

export class OperationGenerator extends Generator<Options> {
  resolve(operation: Operation): Resolver {
    const { resolvePath, resolveName } = this.options

    const name = resolveName({ name: `use ${operation.getOperationId()}`, pluginName })

    if (!name) {
      throw new Error('Name should be defined')
    }

    const fileName = `${name}.ts`
    const filePath = resolvePath({
      fileName,
      options: { tag: operation.getTags()[0]?.name },
    })

    if (!filePath) {
      throw new Error('Filepath should be defined')
    }

    return {
      name,
      fileName,
      filePath,
    }
  }

  resolveType(operation: Operation): Resolver {
    const { resolvePath, resolveName } = this.options

    const name = resolveName({ name: operation.getOperationId(), pluginName: swaggerTypescriptPluginName })

    if (!name) {
      throw new Error('Name should be defined')
    }

    const fileName = `${name}.ts`
    const filePath = resolvePath({ fileName, options: { tag: operation.getTags()[0]?.name }, pluginName: swaggerTypescriptPluginName })

    if (!filePath) {
      throw new Error('Filepath should be defined')
    }

    return {
      name,
      fileName,
      filePath,
    }
  }

  resolveError(operation: Operation, statusCode: number): Resolver {
    const { resolvePath, resolveName } = this.options

    const name = resolveName({ name: `${operation.getOperationId()} ${statusCode}`, pluginName: swaggerTypescriptPluginName })

    if (!name) {
      throw new Error('Name should be defined')
    }

    const fileName = `${name}.ts`
    const filePath = resolvePath({
      fileName,
      options: { tag: operation.getTags()[0]?.name },
      pluginName: swaggerTypescriptPluginName,
    })

    if (!filePath) {
      throw new Error('Filepath should be defined')
    }

    return {
      name,
      fileName,
      filePath,
    }
  }

  resolveErrors(items: Array<{ operation: Operation; statusCode: number }>): Resolver[] {
    return items.map((item) => this.resolveError(item.operation, item.statusCode))
  }

  async all(): Promise<File | null> {
    return null
  }

  async get(operation: Operation, schemas: OperationSchemas): Promise<File | null> {
    const { clientPath } = this.options

    const hook = this.resolve(operation)
    const type = this.resolveType(operation)

    const comments = getComments(operation)
    const sources: string[] = []
    const pathParams = getParams(schemas.pathParams)
    const pathParamsTyped = getParams(schemas.pathParams, { typed: true })
    let errors: Resolver[] = []

    if (schemas.errors) {
      errors = this.resolveErrors(schemas.errors?.map((item) => item.statusCode && { operation, statusCode: item.statusCode }).filter(Boolean))
    }

    const generics = [`TData = ${schemas.response.name}`, `TError = ${errors.map((error) => error.name).join(' | ') || 'unknown'}`].filter(Boolean)
    const clientGenerics = ['TData', 'TError'].filter(Boolean)
    const params = [
      pathParamsTyped,
      schemas.queryParams?.name ? `params?: ${schemas.queryParams?.name}` : '',
      `options?: { query?: SWRConfiguration<${clientGenerics.join(', ')}> }`,
    ].filter(Boolean)
    const paramsQueryOptions = [pathParamsTyped, schemas.queryParams?.name ? `params?: ${schemas.queryParams?.name}` : ''].filter(Boolean)

    if (schemas.queryParams && !schemas.pathParams) {
      sources.push(`
        export function ${camelCase(`${operation.getOperationId()}QueryOptions`)} <${generics.join(', ')}>(${paramsQueryOptions.join(
        ', '
      )}): SWRConfiguration<${clientGenerics.join(', ')}> {
          return {
            fetcher: () => {
              return client<${clientGenerics.join(', ')}>({
                method: "get",
                url: ${new URLPath(operation.path).template},
                params
              });
            },
          };
        };
      `)

      sources.push(`
        ${createJSDocBlockText({ comments })}
        export function ${hook.name} <${generics.join(', ')}>(${params.join(', ')}): SWRResponse<${clientGenerics.join(', ')}> {
          const { query: queryOptions } = options ?? {};
          
          const query = useSWR<${clientGenerics.join(', ')}, string>(${new URLPath(operation.path).template}, {
            ...${camelCase(`${operation.getOperationId()}QueryOptions`)}<${clientGenerics.join(', ')}>(params),
            ...queryOptions
          });

          return query;
        };
      `)
    }

    if (!schemas.queryParams && schemas.pathParams) {
      sources.push(`
        export function ${camelCase(`${operation.getOperationId()}QueryOptions`)} <${generics.join(', ')}>(${paramsQueryOptions.join(
        ', '
      )}): SWRConfiguration<${clientGenerics.join(', ')}> {

          return {
            fetcher: () => {
              return client<${clientGenerics.join(', ')}>({
                method: "get",
                url: ${new URLPath(operation.path).template}
              });
            },
          };
        };
      `)

      sources.push(`
        ${createJSDocBlockText({ comments })}
        export function ${hook.name} <${generics.join(', ')}>(${params.join(', ')}): SWRResponse<${clientGenerics.join(', ')}> {
          const { query: queryOptions } = options ?? {};
          
          const query = useSWR<${clientGenerics.join(', ')}, string>(${new URLPath(operation.path).template}, {
            ...${camelCase(`${operation.getOperationId()}QueryOptions`)}<${clientGenerics.join(', ')}>(${pathParams}),
            ...queryOptions
          });

          return query;
        };
      `)
    }

    if (schemas.queryParams && schemas.pathParams) {
      sources.push(`
        export function ${camelCase(`${operation.getOperationId()}QueryOptions`)} <${generics.join(', ')}>(${paramsQueryOptions.join(
        ', '
      )}): SWRConfiguration<${clientGenerics.join(', ')}> {

          return {
            fetcher: () => {
              return client<${clientGenerics.join(', ')}>({
                method: "get",
                url: ${new URLPath(operation.path).template},
                params
              });
            },
          };
        };
      `)

      sources.push(`
        ${createJSDocBlockText({ comments })}
        export function ${hook.name} <${generics.join(', ')}>(${params.join(', ')}): SWRResponse<${clientGenerics.join(', ')}> {
          const { query: queryOptions } = options ?? {};
          
          const query = useSWR<${clientGenerics.join(', ')}, string>(${new URLPath(operation.path).template}, {
            ...${camelCase(`${operation.getOperationId()}QueryOptions`)}<${clientGenerics.join(', ')}>(${pathParams}, params),
            ...queryOptions
          });

          return query;
        };
      `)
    }

    if (!schemas.queryParams && !schemas.pathParams) {
      sources.push(`
      export function ${camelCase(`${operation.getOperationId()}QueryOptions`)} <${generics.join(', ')}>(): SWRConfiguration<${clientGenerics.join(', ')}> {

        return {
          fetcher: () => {
            return client<${clientGenerics.join(', ')}>({
              method: "get",
              url: ${new URLPath(operation.path).template}
            });
          },
        };
      };
    `)

      sources.push(`
        ${createJSDocBlockText({ comments })}
        export function ${hook.name} <${generics.join(', ')}>(${params.join(', ')}): SWRResponse<${clientGenerics.join(', ')}> {
          const { query: queryOptions } = options ?? {};

          const query = useSWR<${clientGenerics.join(', ')}, string>(${new URLPath(operation.path).template}, {
            ...${camelCase(`${operation.getOperationId()}QueryOptions`)}<${clientGenerics.join(', ')}>(),
            ...queryOptions
          });

          return query;
        };
      `)
    }

    return {
      path: hook.filePath,
      fileName: hook.fileName,
      source: sources.join('\n'),
      imports: [
        {
          name: 'useSWR',
          path: 'swr',
        },
        {
          name: ['SWRConfiguration', 'SWRResponse'],
          path: 'swr',
          isTypeOnly: true,
        },
        {
          name: 'client',
          path: clientPath ? getRelativePath(hook.filePath, clientPath) : '@kubb/swagger-client/client',
        },
        {
          name: [schemas.response.name, schemas.pathParams?.name, schemas.queryParams?.name, ...errors.map((error) => error.name)].filter(Boolean),
          path: getRelativePath(hook.filePath, type.filePath),
          isTypeOnly: true,
        },
      ],
    }
  }

  async post(operation: Operation, schemas: OperationSchemas): Promise<File | null> {
    const { clientPath } = this.options

    const hook = this.resolve(operation)
    const type = this.resolveType(operation)

    const comments = getComments(operation)
    const sources: string[] = []
    const pathParamsTyped = getParams(schemas.pathParams, { typed: true })
    let errors: Resolver[] = []

    if (schemas.errors) {
      errors = this.resolveErrors(schemas.errors?.map((item) => item.statusCode && { operation, statusCode: item.statusCode }).filter(Boolean))
    }

    const generics = [
      `TData = ${schemas.response.name}`,
      `TError = ${errors.map((error) => error.name).join(' | ') || 'unknown'}`,
      schemas.request?.name ? `TVariables = ${schemas.request?.name}` : '',
    ].filter(Boolean)
    const clientGenerics = ['TData', 'TError', schemas.request?.name ? `TVariables` : ''].filter(Boolean)
    const SWRMutationGenerics = ['TData', 'TError', 'string', schemas.request?.name ? `TVariables` : ''].filter(Boolean)
    const SWRMutationConfigurationGenerics = ['TData', 'TError', schemas.request?.name ? `TVariables` : '', 'string'].filter(Boolean)
    const params = [
      pathParamsTyped,
      schemas.queryParams?.name ? `params?: ${schemas.queryParams?.name}` : '',
      `options?: {
      mutation?: SWRMutationConfiguration<${SWRMutationConfigurationGenerics.join(', ')}>
    }`,
    ].filter(Boolean)

    sources.push(`
        ${createJSDocBlockText({ comments })}
        export function ${hook.name} <${generics.join(', ')}>(${params.join(', ')}) {
          const { mutation: mutationOptions } = options ?? {};

          return useSWRMutation<${SWRMutationGenerics.join(', ')}>(
          ${new URLPath(operation.path).template},
            (url${schemas.request?.name ? ', { arg: data }' : ''}) => {
              return client<${clientGenerics.join(', ')}>({
                method: "post",
                url,
                ${schemas.request?.name ? 'data,' : ''}
                ${schemas.queryParams?.name ? 'params,' : ''}
              })
            },
            mutationOptions
          );
        };
    `)

    return {
      path: hook.filePath,
      fileName: hook.fileName,
      source: sources.join('\n'),
      imports: [
        {
          name: 'useSWRMutation',
          path: 'swr/mutation',
        },
        {
          name: ['SWRMutationConfiguration'],
          path: 'swr/mutation',
          isTypeOnly: true,
        },
        {
          name: 'client',
          path: clientPath ? getRelativePath(hook.filePath, clientPath) : '@kubb/swagger-client/client',
        },
        {
          name: [
            schemas.request?.name,
            schemas.response.name,
            schemas.pathParams?.name,
            schemas.queryParams?.name,
            ...errors.map((error) => error.name),
          ].filter(Boolean),
          path: getRelativePath(hook.filePath, type.filePath),
          isTypeOnly: true,
        },
      ],
    }
  }

  async put(operation: Operation, schemas: OperationSchemas): Promise<File | null> {
    const { clientPath } = this.options

    const hook = this.resolve(operation)
    const type = this.resolveType(operation)

    const comments = getComments(operation)
    const sources: string[] = []
    const pathParamsTyped = getParams(schemas.pathParams, { typed: true })
    let errors: Resolver[] = []

    if (schemas.errors) {
      errors = this.resolveErrors(schemas.errors?.map((item) => item.statusCode && { operation, statusCode: item.statusCode }).filter(Boolean))
    }

    const generics = [
      `TData = ${schemas.response.name}`,
      `TError = ${errors.map((error) => error.name).join(' | ') || 'unknown'}`,
      schemas.request?.name ? `TVariables = ${schemas.request?.name}` : '',
    ].filter(Boolean)
    const clientGenerics = ['TData', 'TError', schemas.request?.name ? `TVariables` : ''].filter(Boolean)
    const SWRMutationGenerics = ['TData', 'TError', 'string', schemas.request?.name ? `TVariables` : ''].filter(Boolean)
    const SWRMutationConfigurationGenerics = ['TData', 'TError', schemas.request?.name ? `TVariables` : '', 'string'].filter(Boolean)
    const params = [
      pathParamsTyped,
      schemas.queryParams?.name ? `params?: ${schemas.queryParams?.name}` : '',
      `options?: {
      mutation?: SWRMutationConfiguration<${SWRMutationConfigurationGenerics.join(', ')}>
    }`,
    ].filter(Boolean)

    sources.push(`
        ${createJSDocBlockText({ comments })}
        export function ${hook.name} <${generics.join(', ')}>(${params.join(', ')}) {
          const { mutation: mutationOptions } = options ?? {};

          return useSWRMutation<${SWRMutationGenerics.join(', ')}>(
          ${new URLPath(operation.path).template},
          (url${schemas.request?.name ? ', { arg: data }' : ''}) => {
              return client<${clientGenerics.join(', ')}>({
                method: "put",
                url,
                ${schemas.request?.name ? 'data,' : ''}
                ${schemas.queryParams?.name ? 'params,' : ''}
              })
            },
            mutationOptions
          );
        };
    `)

    return {
      path: hook.filePath,
      fileName: hook.fileName,
      source: sources.join('\n'),
      imports: [
        {
          name: 'useSWRMutation',
          path: 'swr/mutation',
        },
        {
          name: ['SWRMutationConfiguration'],
          path: 'swr/mutation',
          isTypeOnly: true,
        },
        {
          name: 'client',
          path: clientPath ? getRelativePath(hook.filePath, clientPath) : '@kubb/swagger-client/client',
        },
        {
          name: [
            schemas.request?.name,
            schemas.response.name,
            schemas.pathParams?.name,
            schemas.queryParams?.name,
            ...errors.map((error) => error.name),
          ].filter(Boolean),
          path: getRelativePath(hook.filePath, type.filePath),
          isTypeOnly: true,
        },
      ],
    }
  }

  async delete(operation: Operation, schemas: OperationSchemas): Promise<File | null> {
    const { clientPath } = this.options

    const hook = this.resolve(operation)
    const type = this.resolveType(operation)

    const comments = getComments(operation)
    const sources: string[] = []
    const pathParamsTyped = getParams(schemas.pathParams, { typed: true })
    let errors: Resolver[] = []

    if (schemas.errors) {
      errors = this.resolveErrors(schemas.errors?.map((item) => item.statusCode && { operation, statusCode: item.statusCode }).filter(Boolean))
    }

    const generics = [
      `TData = ${schemas.response.name}`,
      `TError = ${errors.map((error) => error.name).join(' | ') || 'unknown'}`,
      schemas.request?.name ? `TVariables = ${schemas.request?.name}` : '',
    ].filter(Boolean)
    const clientGenerics = ['TData', 'TError', schemas.request?.name ? `TVariables` : ''].filter(Boolean)
    const SWRMutationGenerics = ['TData', 'TError', 'string', schemas.request?.name ? `TVariables` : ''].filter(Boolean)
    const SWRMutationConfigurationGenerics = ['TData', 'TError', schemas.request?.name ? `TVariables` : '', 'string'].filter(Boolean)
    const params = [
      pathParamsTyped,
      schemas.queryParams?.name ? `params?: ${schemas.queryParams?.name}` : '',
      `options?: {
      mutation?: SWRMutationConfiguration<${SWRMutationConfigurationGenerics.join(', ')}>
    }`,
    ].filter(Boolean)

    sources.push(`
      ${createJSDocBlockText({ comments })}
      export function ${hook.name} <${generics.join(', ')}>(${params.join(', ')}) {
        const { mutation: mutationOptions } = options ?? {};

        return useSWRMutation<${SWRMutationGenerics.join(', ')}>(
        ${new URLPath(operation.path).template},
        (url${schemas.request?.name ? ', { arg: data }' : ''}) => {
            return client<${clientGenerics.join(', ')}>({
              method: "delete",
              url,
              ${schemas.request?.name ? 'data,' : ''}
              ${schemas.queryParams?.name ? 'params,' : ''}
            })
          },
          mutationOptions
        );
      };
    `)

    return {
      path: hook.filePath,
      fileName: hook.fileName,
      source: sources.join('\n'),
      imports: [
        {
          name: 'useSWRMutation',
          path: 'swr/mutation',
        },
        {
          name: ['SWRMutationConfiguration'],
          path: 'swr/mutation',
          isTypeOnly: true,
        },
        {
          name: 'client',
          path: clientPath ? getRelativePath(hook.filePath, clientPath) : '@kubb/swagger-client/client',
        },
        {
          name: [
            schemas.request?.name,
            schemas.response.name,
            schemas.pathParams?.name,
            schemas.queryParams?.name,
            ...errors.map((error) => error.name),
          ].filter(Boolean),
          path: getRelativePath(hook.filePath, type.filePath),
          isTypeOnly: true,
        },
      ],
    }
  }
}
