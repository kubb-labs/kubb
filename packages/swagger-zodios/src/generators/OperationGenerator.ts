import { camelCase } from 'change-case'

import type { File, FileManager, PluginContext } from '@kubb/core'
import { getRelativePath, getText } from '@kubb/core'
import { Path, OperationGenerator as Generator } from '@kubb/swagger'
import type { Oas, Operation, HttpMethod, Resolver } from '@kubb/swagger'
import { pluginName as swaggerZodPluginName } from '@kubb/swagger-zod'

import { pluginName } from '../plugin'

type Options = {
  oas: Oas
  resolvePath: PluginContext['resolvePath']
  resolveName: PluginContext['resolveName']
  output: string
  directory: string
  fileManager: FileManager
}

export class OperationGenerator extends Generator<Options> {
  async resolve(): Promise<Resolver> {
    const { directory, resolvePath, output, resolveName } = this.options

    const name = await resolveName({ name: output.replace('.ts', ''), pluginName })
    const fileName = `${name}.ts`
    const filePath = await resolvePath({
      fileName,
      directory,
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

  async resolveResponse(operation: Operation): Promise<Resolver> {
    const { directory, resolvePath, resolveName } = this.options

    const name = await resolveName({ name: `${operation.getOperationId()}ResponseSchema`, pluginName })
    const fileName = `${camelCase(`${operation.getOperationId()}Schema`, { delimiter: '' })}.ts`
    const filePath = await resolvePath({
      fileName,
      directory,
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

  async resolvePathParams(operation: Operation): Promise<Resolver> {
    const { directory, resolvePath, resolveName } = this.options

    const name = await resolveName({ name: `${operation.getOperationId()}PathParamsSchema`, pluginName })
    const fileName = `${camelCase(`${operation.getOperationId()}Schema`, { delimiter: '' })}.ts`
    const filePath = await resolvePath({
      fileName,
      directory,
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

  async resolveError(operation: Operation, statusCode: number): Promise<Resolver> {
    const { directory, resolvePath, resolveName } = this.options

    const name = await resolveName({ name: `${operation.getOperationId()} ${statusCode} Schema`, pluginName })
    const fileName = `${camelCase(`${operation.getOperationId()}Schema`, { delimiter: '' })}.ts`
    const filePath = await resolvePath({
      fileName,
      directory,
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

  async resolveQueryParams(operation: Operation): Promise<Resolver> {
    const { directory, resolvePath, resolveName } = this.options

    const name = await resolveName({ name: `${operation.getOperationId()}QueryParamsSchema`, pluginName })
    const fileName = `${camelCase(`${operation.getOperationId()}Schema`, { delimiter: '' })}.ts`
    const filePath = await resolvePath({
      fileName,
      directory,
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

  async all(paths: Record<string, Record<HttpMethod, Operation | undefined>>): Promise<File | null> {
    const imports: File['imports'] = [
      {
        name: ['makeApi', 'Zodios'],
        path: '@zodios/core',
      },
    ]

    const zodios = await this.resolve()

    const mapOperationToZodios = async (operation: Operation) => {
      const schemas = this.getSchemas(operation)
      const parameters: string[] = []
      const errors: string[] = []

      const response = await this.resolveResponse(operation)

      imports.push({
        name: [response.name],
        path: getRelativePath(zodios.filePath, response.filePath),
      })

      if (schemas.pathParams) {
        const pathParams = await this.resolvePathParams(operation)

        imports.push({
          name: [pathParams.name],
          path: getRelativePath(zodios.filePath, pathParams.filePath),
        })

        parameters.push(`
          {
            name: "${schemas.pathParams.name}",
            description: \`${getText(schemas.pathParams.description)}\`,
            type: "Path",
            schema: ${pathParams.name}
          }
        `)
      }

      if (schemas.queryParams) {
        const queryParams = await this.resolveQueryParams(operation)

        imports.push({
          name: [queryParams.name],
          path: getRelativePath(zodios.filePath, queryParams.filePath),
        })

        parameters.push(`
          {
            name: "${schemas.queryParams.name}",
            description: \`${getText(schemas.queryParams.description)}\`,
            type: "Query",
            schema: ${queryParams.name}
          }
        `)
      }
      if (schemas.errors) {
        const errorPromise = schemas.errors
          .filter((errorOperationSchema) => errorOperationSchema.statusCode)
          .map(async (errorOperationSchema) => {
            const { filePath, name } = await this.resolveError(operation, errorOperationSchema.statusCode!)

            imports.push({
              name: [name],
              path: getRelativePath(zodios.filePath, filePath),
            })

            errors.push(`
            {
              status: ${errorOperationSchema.statusCode},
              description: \`${errorOperationSchema.description}\`,
              schema: ${name}
            }
          `)
          })

        await Promise.all(errorPromise)
      }

      return `
        {
          method: "${operation.method}",
          path: "${new Path(operation.path).URL}",
          description: \`${getText(operation.getDescription())}\`,
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
    const definitionsPromises = Object.keys(paths).reduce((acc, path) => {
      const operations = paths[path]

      if (operations.get) {
        acc.push(mapOperationToZodios(operations.get))
      }

      if (operations.post) {
        acc.push(mapOperationToZodios(operations.post))
      }

      if (operations.put) {
        acc.push(mapOperationToZodios(operations.put))
      }

      if (operations.delete) {
        acc.push(mapOperationToZodios(operations.delete))
      }

      return acc
    }, [] as Promise<string>[])

    const sources: string[] = []
    const definitions = await Promise.all(definitionsPromises)

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

  async put(): Promise<File | null> {
    return null
  }

  async delete(): Promise<File | null> {
    return null
  }
}
