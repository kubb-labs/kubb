import { escape, getRelativePath, URLPath } from '@kubb/core'
import { OperationGenerator as Generator, resolve } from '@kubb/swagger'
import { pluginName as swaggerZodPluginName } from '@kubb/swagger-zod'

import { camelCase, camelCaseTransformMerge } from 'change-case'

import { pluginName } from '../plugin.ts'

import type { KubbFile, PluginContext } from '@kubb/core'
import type { ContentType, HttpMethod, Oas, OpenAPIV3, Operation, Resolver, SkipBy } from '@kubb/swagger'

type Options = {
  oas: Oas
  skipBy?: SkipBy[]
  contentType?: ContentType
  resolvePath: PluginContext['resolvePath']
  resolveName: PluginContext['resolveName']
  output: string
}

const methods: HttpMethod[] = ['get', 'post', 'patch', 'put', 'delete']

export class OperationGenerator extends Generator<Options> {
  resolve(): Resolver {
    const { resolvePath, output, resolveName } = this.options

    const name = resolveName({ name: output.replace('.ts', ''), pluginName })

    return resolve({
      name,
      resolveName,
      resolvePath,
      pluginName,
    })
  }

  resolveResponse(operation: Operation): Resolver {
    const { resolvePath, resolveName } = this.options

    const schemas = this.getSchemas(operation)

    const name = resolveName({ name: schemas.response.name, pluginName: swaggerZodPluginName })
    const fileName: KubbFile.BaseName = `${camelCase(`${operation.getOperationId()}Schema`, { delimiter: '', transform: camelCaseTransformMerge })}.ts`
    const filePath = resolvePath({
      fileName,
      options: { tag: operation.getTags()[0]?.name },
      pluginName: swaggerZodPluginName,
    })

    if (!filePath || !name) {
      throw new Error('Filepath should be defined')
    }

    return {
      name,
      fileName,
      filePath,
    }
  }

  resolveRequest(operation: Operation): Resolver {
    const { resolvePath, resolveName } = this.options

    const schemas = this.getSchemas(operation)

    if (!schemas.request?.name) {
      throw new Error('schemas.request should be defined')
    }

    const name = resolveName({ name: schemas.request.name, pluginName: swaggerZodPluginName })
    const fileName = `${camelCase(`${operation.getOperationId()}Schema`, { delimiter: '', transform: camelCaseTransformMerge })}.ts` as const
    const filePath = resolvePath({
      fileName,
      options: { tag: operation.getTags()[0]?.name },
      pluginName: swaggerZodPluginName,
    })

    if (!filePath || !name) {
      throw new Error('Filepath should be defined')
    }

    return {
      name,
      fileName,
      filePath,
    }
  }

  resolveHeaderParams(operation: Operation): Resolver {
    const { resolvePath, resolveName } = this.options

    const schemas = this.getSchemas(operation)
    if (!schemas.headerParams?.name) {
      throw new Error('schemas.pathParams should be defined')
    }

    const name = resolveName({ name: schemas.headerParams.name, pluginName: swaggerZodPluginName })
    const fileName = `${camelCase(`${operation.getOperationId()}Schema`, { delimiter: '', transform: camelCaseTransformMerge })}.ts` as const
    const filePath = resolvePath({
      fileName,
      options: { tag: operation.getTags()[0]?.name },
      pluginName: swaggerZodPluginName,
    })

    if (!filePath || !name) {
      throw new Error('Filepath should be defined')
    }

    return {
      name,
      fileName,
      filePath,
    }
  }

  resolvePathParams(operation: Operation): Resolver {
    const { resolvePath, resolveName } = this.options

    const schemas = this.getSchemas(operation)
    if (!schemas.pathParams?.name) {
      throw new Error('schemas.pathParams should be defined')
    }

    const name = resolveName({ name: schemas.pathParams.name, pluginName: swaggerZodPluginName })
    const fileName = `${camelCase(`${operation.getOperationId()}Schema`, { delimiter: '', transform: camelCaseTransformMerge })}.ts` as const
    const filePath = resolvePath({
      fileName,
      options: { tag: operation.getTags()[0]?.name },
      pluginName: swaggerZodPluginName,
    })

    if (!filePath || !name) {
      throw new Error('Filepath should be defined')
    }

    return {
      name,
      fileName,
      filePath,
    }
  }

  resolveQueryParams(operation: Operation): Resolver {
    const { resolvePath, resolveName } = this.options

    const schemas = this.getSchemas(operation)

    if (!schemas.queryParams?.name) {
      throw new Error('schemas.queryParams should be defined')
    }

    const name = resolveName({ name: schemas.queryParams.name, pluginName: swaggerZodPluginName })
    const fileName = `${camelCase(`${operation.getOperationId()}Schema`, { delimiter: '', transform: camelCaseTransformMerge })}.ts` as const
    const filePath = resolvePath({
      fileName,
      options: { tag: operation.getTags()[0]?.name },
      pluginName: swaggerZodPluginName,
    })

    if (!filePath || !name) {
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

    const name = resolveName({ name: `${operation.getOperationId()} ${statusCode}`, pluginName: swaggerZodPluginName })
    const fileName = `${camelCase(`${operation.getOperationId()}Schema`, { delimiter: '', transform: camelCaseTransformMerge })}.ts` as const
    const filePath = resolvePath({
      fileName,
      options: { tag: operation.getTags()[0]?.name },
      pluginName: swaggerZodPluginName,
    })

    if (!filePath || !name) {
      throw new Error('Filepath should be defined')
    }

    return {
      name,
      fileName,
      filePath,
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
        path: getRelativePath(zodios.filePath, response.filePath),
      })

      if (schemas.pathParams) {
        const pathParams = this.resolvePathParams(operation)

        imports.push({
          name: [pathParams.name],
          path: getRelativePath(zodios.filePath, pathParams.filePath),
        })

        schemas.pathParams.keys?.forEach((key) => {
          const schema = schemas.pathParams?.schema?.properties?.[key] as OpenAPIV3.SchemaObject
          const zodSchema = schemas.pathParams?.schema?.$ref ? `${pathParams.name}.schema.shape['${key}']` : `${pathParams.name}.shape['${key}']`

          parameters.push(`
          {
            name: "${key}",
            description: \`${escape(schema?.description)}\`,
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
          path: getRelativePath(zodios.filePath, queryParams.filePath),
        })

        schemas.queryParams.keys?.forEach((key) => {
          const schema = schemas.queryParams?.schema?.properties?.[key] as OpenAPIV3.SchemaObject
          const zodSchema = schemas.queryParams?.schema?.$ref ? `${queryParams.name}.schema.shape['${key}']` : `${queryParams.name}.shape['${key}']`

          parameters.push(`
          {
            name: "${key}",
            description: \`${escape(schema?.description)}\`,
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
          path: getRelativePath(zodios.filePath, requestBody.filePath),
        })
        schemas.request.keys?.forEach((key) => {
          const schema = schemas.request?.schema?.properties?.[key] as OpenAPIV3.SchemaObject
          const zodSchema = schemas.request?.schema?.$ref ? `${requestBody.name}.schema.shape['${key}']` : `${requestBody.name}.shape['${key}']`

          parameters.push(`
          {
            name: "${key}",
            description: \`${escape(schema?.description)}\`,
            type: "Body",
            schema: ${zodSchema}
          }
        `)
        })
      }

      if (schemas.headerParams) {
        const headerParams = this.resolveHeaderParams(operation)

        imports.push({
          name: [headerParams.name],
          path: getRelativePath(zodios.filePath, headerParams.filePath),
        })

        schemas.headerParams.keys?.forEach((key) => {
          const schema = schemas.headerParams?.schema?.properties?.[key] as OpenAPIV3.SchemaObject
          const zodSchema = schemas.headerParams?.schema?.$ref ? `${headerParams.name}.schema.shape['${key}']` : `${headerParams.name}.shape['${key}']`

          parameters.push(`
          {
            name: "${key}",
            description: \`${escape(schema?.description)}\`,
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

          const { filePath, name } = this.resolveError(operation, errorOperationSchema.statusCode)

          imports.push({
            name: [name],
            path: getRelativePath(zodios.filePath, filePath),
          })

          if (errorOperationSchema.statusCode) {
            errors.push(`
              {
                status: ${errorOperationSchema.statusCode},
                description: \`${escape(errorOperationSchema.description)}\`,
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
          description: \`${escape(operation.getDescription())}\`,
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
      path: zodios.filePath,
      baseName: zodios.fileName,
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
