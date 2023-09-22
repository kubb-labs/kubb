import { getEncodedText, getRelativePath, URLPath } from '@kubb/core'
import { OperationGenerator as Generator } from '@kubb/swagger'
import { pluginName as swaggerZodPluginName } from '@kubb/swagger-zod'

import { camelCase } from 'case-anything'

import { pluginName } from '../plugin.ts'

import type { File, PluginContext } from '@kubb/core'
import type { ContentType, HttpMethod, Oas, Operation, Resolver, SkipBy } from '@kubb/swagger'

type Options = {
  oas: Oas
  skipBy?: SkipBy[]
  contentType?: ContentType
  resolvePath: PluginContext['resolvePath']
  resolveName: PluginContext['resolveName']
  output: string
}

export class OperationGenerator extends Generator<Options> {
  resolve(): Resolver {
    const { resolvePath, output, resolveName } = this.options

    const name = resolveName({ name: output.replace('.ts', ''), pluginName })

    if (!name) {
      throw new Error('Name should be defined')
    }

    const fileName = `${name}.ts`
    const filePath = resolvePath({
      fileName,
      pluginName,
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

  resolveResponse(operation: Operation): Resolver {
    const { resolvePath, resolveName } = this.options

    const schemas = this.getSchemas(operation)

    const name = resolveName({ name: schemas.response.name, pluginName: swaggerZodPluginName })
    const fileName = `${camelCase(`${operation.getOperationId()}Schema`)}.ts`
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
    const fileName = `${camelCase(`${operation.getOperationId()}Schema`)}.ts`
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
    const fileName = `${camelCase(`${operation.getOperationId()}Schema`)}.ts`
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
    const fileName = `${camelCase(`${operation.getOperationId()}Schema`)}.ts`
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

  resolveErrors(items: Array<{ operation: Operation; statusCode: number }>): Resolver[] {
    return items.map((item) => this.resolveError(item.operation, item.statusCode))
  }

  async all(paths: Record<string, Record<HttpMethod, Operation | undefined>>): Promise<File | null> {
    const imports: File['imports'] = [
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

        parameters.push(`
          {
            name: "${schemas.pathParams.name}",
            description: \`${getEncodedText(schemas.pathParams.description)}\`,
            type: "Path",
            schema: ${pathParams.name}
          }
        `)
      }

      if (schemas.queryParams) {
        const queryParams = this.resolveQueryParams(operation)

        imports.push({
          name: [queryParams.name],
          path: getRelativePath(zodios.filePath, queryParams.filePath),
        })

        parameters.push(`
          {
            name: "${schemas.queryParams.name}",
            description: \`${getEncodedText(schemas.queryParams.description)}\`,
            type: "Query",
            schema: ${queryParams.name}
          }
        `)
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
                description: \`${getEncodedText(errorOperationSchema.description)}\`,
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
          description: \`${getEncodedText(operation.getDescription())}\`,
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
      const methods: HttpMethod[] = ['get', 'post', 'patch', 'put', 'delete']

      methods.forEach((method) => {
        // use isSkipped to also exclude operations(skipby in our Zod plugin).
        if (operations[method] && !this.isSkipped(operations[method]!, method)) {
          acc.push(mapOperationToZodios(operations[method]!))
        }
      })

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
      fileName: zodios.fileName,
      source: sources.join('\n'),
      imports,
    }
  }

  async get(): Promise<File | null> {
    return null
  }

  async post(): Promise<File | null> {
    return null
  }
  async patch(): Promise<File | null> {
    return null
  }

  async put(): Promise<File | null> {
    return null
  }

  async delete(): Promise<File | null> {
    return null
  }
}
