import { getRelativePath, transformers, URLPath } from '@kubb/core/utils'
import { OperationGenerator as Generator, resolve } from '@kubb/swagger'
import { pluginKey as swaggerZodPluginKey } from '@kubb/swagger-zod'

import { camelCase, camelCaseTransformMerge } from 'change-case'

import type { KubbFile } from '@kubb/core'
import type { HttpMethod, OpenAPIV3, Operation, Resolver } from '@kubb/swagger'

type Options = {
  output: string
}

const methods: HttpMethod[] = ['get', 'post', 'patch', 'put', 'delete']

export class OperationGenerator extends Generator<Options> {
  resolve(): Resolver {
    const { output } = this.options
    const { pluginManager, plugin } = this.context

    const name = pluginManager.resolveName({ name: output.replace('.ts', ''), pluginKey: plugin.key })

    return resolve({
      name,
      resolveName: pluginManager.resolveName,
      resolvePath: pluginManager.resolvePath,
      pluginKey: plugin.key,
    })
  }

  resolveResponse(operation: Operation): Resolver {
    const { pluginManager } = this.context

    const schemas = this.getSchemas(operation)

    const name = pluginManager.resolveName({ name: schemas.response.name, pluginKey: swaggerZodPluginKey })
    const baseName: KubbFile.BaseName = `${camelCase(`${operation.getOperationId()}Schema`, { delimiter: '', transform: camelCaseTransformMerge })}.ts`
    const filePath = pluginManager.resolvePath({
      baseName: baseName,
      options: { tag: operation.getTags()[0]?.name },
      pluginKey: swaggerZodPluginKey,
    })

    if (!filePath || !name) {
      throw new Error('Filepath should be defined')
    }

    return {
      name,
      baseName: baseName,
      path: filePath,
    }
  }

  resolveRequest(operation: Operation): Resolver {
    const { pluginManager } = this.context

    const schemas = this.getSchemas(operation)

    if (!schemas.request?.name) {
      throw new Error('schemas.request should be defined')
    }

    const name = pluginManager.resolveName({ name: schemas.request.name, pluginKey: swaggerZodPluginKey })
    const baseName = `${camelCase(`${operation.getOperationId()}Schema`, { delimiter: '', transform: camelCaseTransformMerge })}.ts` as const
    const filePath = pluginManager.resolvePath({
      baseName: baseName,
      options: { tag: operation.getTags()[0]?.name },
      pluginKey: swaggerZodPluginKey,
    })

    if (!filePath || !name) {
      throw new Error('Filepath should be defined')
    }

    return {
      name,
      baseName: baseName,
      path: filePath,
    }
  }

  resolveHeaderParams(operation: Operation): Resolver {
    const { pluginManager } = this.context

    const schemas = this.getSchemas(operation)
    if (!schemas.headerParams?.name) {
      throw new Error('schemas.pathParams should be defined')
    }

    const name = pluginManager.resolveName({ name: schemas.headerParams.name, pluginKey: swaggerZodPluginKey })
    const baseName = `${camelCase(`${operation.getOperationId()}Schema`, { delimiter: '', transform: camelCaseTransformMerge })}.ts` as const
    const filePath = pluginManager.resolvePath({
      baseName: baseName,
      options: { tag: operation.getTags()[0]?.name },
      pluginKey: swaggerZodPluginKey,
    })

    if (!filePath || !name) {
      throw new Error('Filepath should be defined')
    }

    return {
      name,
      baseName: baseName,
      path: filePath,
    }
  }

  resolvePathParams(operation: Operation): Resolver {
    const { pluginManager } = this.context

    const schemas = this.getSchemas(operation)
    if (!schemas.pathParams?.name) {
      throw new Error('schemas.pathParams should be defined')
    }

    const name = pluginManager.resolveName({ name: schemas.pathParams.name, pluginKey: swaggerZodPluginKey })
    const baseName = `${camelCase(`${operation.getOperationId()}Schema`, { delimiter: '', transform: camelCaseTransformMerge })}.ts` as const
    const filePath = pluginManager.resolvePath({
      baseName: baseName,
      options: { tag: operation.getTags()[0]?.name },
      pluginKey: swaggerZodPluginKey,
    })

    if (!filePath || !name) {
      throw new Error('Filepath should be defined')
    }

    return {
      name,
      baseName: baseName,
      path: filePath,
    }
  }

  resolveQueryParams(operation: Operation): Resolver {
    const { pluginManager } = this.context

    const schemas = this.getSchemas(operation)

    if (!schemas.queryParams?.name) {
      throw new Error('schemas.queryParams should be defined')
    }

    const name = pluginManager.resolveName({ name: schemas.queryParams.name, pluginKey: swaggerZodPluginKey })
    const baseName = `${camelCase(`${operation.getOperationId()}Schema`, { delimiter: '', transform: camelCaseTransformMerge })}.ts` as const
    const filePath = pluginManager.resolvePath({
      baseName: baseName,
      options: { tag: operation.getTags()[0]?.name },
      pluginKey: swaggerZodPluginKey,
    })

    if (!filePath || !name) {
      throw new Error('Filepath should be defined')
    }

    return {
      name,
      baseName: baseName,
      path: filePath,
    }
  }

  resolveError(operation: Operation, statusCode: number): Resolver {
    const { pluginManager } = this.context

    const name = pluginManager.resolveName({ name: `${operation.getOperationId()} ${statusCode}`, pluginKey: swaggerZodPluginKey })
    const baseName = `${camelCase(`${operation.getOperationId()}Schema`, { delimiter: '', transform: camelCaseTransformMerge })}.ts` as const
    const filePath = pluginManager.resolvePath({
      baseName: baseName,
      options: { tag: operation.getTags()[0]?.name },
      pluginKey: swaggerZodPluginKey,
    })

    if (!filePath || !name) {
      throw new Error('Filepath should be defined')
    }

    return {
      name,
      baseName: baseName,
      path: filePath,
    }
  }

  async all(paths: Record<string, Record<HttpMethod, Operation | undefined>>): Promise<KubbFile.File | null> {
    const imports: Array<KubbFile.Import> = [
      {
        name: ['makeApi', 'Zodios'],
        path: '@zodios/core',
      },
    ]

    const zodios = this.resolve()

    const mapOperationToZodios = (operation: Operation): string => {
      const schemas = this.getSchemas(operation)
      const parameters: string[] = []
      const errors: string[] = []

      const response = this.resolveResponse(operation)

      imports.push({
        name: [response.name],
        path: getRelativePath(zodios.path, response.path),
      })

      if (schemas.pathParams) {
        const pathParams = this.resolvePathParams(operation)

        imports.push({
          name: [pathParams.name],
          path: getRelativePath(zodios.path, pathParams.path),
        })

        schemas.pathParams.keys?.forEach((key) => {
          const schema = schemas.pathParams?.schema?.properties?.[key] as OpenAPIV3.SchemaObject
          const zodSchema = schemas.pathParams?.schema?.$ref ? `${pathParams.name}.schema.shape['${key}']` : `${pathParams.name}.shape['${key}']`

          parameters.push(`
          {
            name: "${key}",
            description: \`${transformers.escape(schema?.description)}\`,
            type: "Path",
            schema: ${zodSchema}
          }
        `)
        })
      }

      if (schemas.queryParams) {
        const queryParams = this.resolveQueryParams(operation)

        imports.push({
          name: [queryParams.name],
          path: getRelativePath(zodios.path, queryParams.path),
        })

        schemas.queryParams.keys?.forEach((key) => {
          const schema = schemas.queryParams?.schema?.properties?.[key] as OpenAPIV3.SchemaObject
          const zodSchema = schemas.queryParams?.schema?.$ref ? `${queryParams.name}.schema.shape['${key}']` : `${queryParams.name}.shape['${key}']`

          parameters.push(`
          {
            name: "${key}",
            description: \`${transformers.escape(schema?.description)}\`,
            type: "Query",
            schema: ${zodSchema}
          }
        `)
        })
      }

      if (schemas.request) {
        const requestBody = this.resolveRequest(operation)

        imports.push({
          name: [requestBody.name],
          path: getRelativePath(zodios.path, requestBody.path),
        })

        parameters.push(`
        {
          name: "${schemas.request.name}",
          description: \`${transformers.escape(schemas.request.description)}\`,
          type: "Body",
          schema: ${requestBody.name}
        }
        `)
      }

      if (schemas.headerParams) {
        const headerParams = this.resolveHeaderParams(operation)

        imports.push({
          name: [headerParams.name],
          path: getRelativePath(zodios.path, headerParams.path),
        })

        schemas.headerParams.keys?.forEach((key) => {
          const schema = schemas.headerParams?.schema?.properties?.[key] as OpenAPIV3.SchemaObject
          const zodSchema = schemas.headerParams?.schema?.$ref ? `${headerParams.name}.schema.shape['${key}']` : `${headerParams.name}.shape['${key}']`

          parameters.push(`
          {
            name: "${key}",
            description: \`${transformers.escape(schema?.description)}\`,
            type: "Header",
            schema: ${zodSchema}
          }
        `)
        })
      }

      if (schemas.errors) {
        schemas.errors.forEach((errorOperationSchema) => {
          if (!errorOperationSchema.statusCode) {
            return
          }

          const { path: filePath, name } = this.resolveError(operation, errorOperationSchema.statusCode)

          imports.push({
            name: [name],
            path: getRelativePath(zodios.path, filePath),
          })

          if (errorOperationSchema.statusCode) {
            errors.push(`
              {
                status: ${errorOperationSchema.statusCode},
                description: \`${transformers.escape(errorOperationSchema.description)}\`,
                schema: ${name}
              }
            `)
          }
        })
      }

      return `
        {
          method: "${operation.method}",
          path: "${new URLPath(operation.path).URL}",
          description: \`${transformers.escape(operation.getDescription())}\`,
          requestFormat: "json",
          parameters: [
              ${parameters.join(',')}
          ],
          response: ${response.name},
          errors: [
              ${errors.join(',')}
          ],
      }
      `
    }
    const definitions = Object.keys(paths).reduce((acc, path) => {
      const operations = paths[path]

      if (operations) {
        methods.forEach((method) => {
          // use isSkipped to also exclude operations(skipby in our Zod plugin).
          if (operations[method] && !this.isSkipped(operations[method]!, method)) {
            acc.push(mapOperationToZodios(operations[method]!))
          }
        })
      }

      return acc
    }, [] as string[])

    const sources: string[] = []

    sources.push(`
      const endpoints = makeApi([${definitions.join(',')}]);

      export const api = new Zodios(endpoints);

      export default api;
    `)

    return {
      path: zodios.path,
      baseName: zodios.baseName,
      source: sources.join('\n'),
      imports,
    }
  }

  async get(): Promise<KubbFile.File | null> {
    return null
  }

  async post(): Promise<KubbFile.File | null> {
    return null
  }
  async patch(): Promise<KubbFile.File | null> {
    return null
  }

  async put(): Promise<KubbFile.File | null> {
    return null
  }

  async delete(): Promise<KubbFile.File | null> {
    return null
  }
}
