import { camelCase } from 'change-case'

import type { File, FileManager, PluginContext } from '@kubb/core'
import { getRelativePath } from '@kubb/core'
import type { Oas, Operation, OperationSchemas, HttpMethod } from '@kubb/swagger'
import { OperationGenerator as Generator } from '@kubb/swagger'
import { pluginName as swaggerZodPluginName } from '@kubb/swagger-zod'

type Options = {
  oas: Oas
  directory: string
  fileName: string
  fileManager: FileManager
  resolveId: PluginContext['resolveId']
}

export class OperationGenerator extends Generator<Options> {
  async all(paths: Record<string, Record<HttpMethod, Operation | undefined>>): Promise<File | null> {
    const { fileName, directory, resolveId } = this.options

    const imports: File['imports'] = [
      {
        name: ['makeApi', 'Zodios', 'ZodiosOptions'],
        path: '@zodios/core',
      },
    ]

    // controller setup
    const controllerFilePath = await resolveId({
      fileName,
      directory,
    })

    if (!controllerFilePath) {
      return null
    }
    // end controller setup

    const mapOperationToZodios = async (operation: Operation) => {
      const schemas = this.getSchemas(operation)
      const parameters: string[] = []

      const responseName = `${camelCase(`${operation.getOperationId()}ResponseSchema`, { delimiter: '' })}`
      const responseFileName = `${camelCase(`${operation.getOperationId()}Schema`, { delimiter: '' })}.ts`
      const responseFilePath = await resolveId({ fileName: responseFileName, directory, pluginName: swaggerZodPluginName })

      imports.push({
        name: [responseName],
        path: getRelativePath(controllerFilePath, responseFilePath),
      })

      if (schemas.pathParams) {
        const pathParamsName = `${camelCase(`${operation.getOperationId()}PathParamsSchema`, { delimiter: '' })}`
        const pathParamsFileName = `${camelCase(`${operation.getOperationId()}Schema`, { delimiter: '' })}.ts`
        const pathparamsFilePath = await resolveId({ fileName: pathParamsFileName, directory, pluginName: swaggerZodPluginName })

        imports.push({
          name: [pathParamsName],
          path: getRelativePath(controllerFilePath, pathparamsFilePath),
        })

        parameters.push(`
          {
            name: "${schemas.pathParams.name}",
            description: \`${schemas.pathParams.description || ''}\`,
            type: 'Path',
            schema: ${pathParamsName}
          }
        `)
      }

      if (schemas.queryParams) {
        const queryParamsName = `${camelCase(`${operation.getOperationId()}QueryParamsSchema`, { delimiter: '' })}`
        const queryParamsFileName = `${camelCase(`${operation.getOperationId()}Schema`, { delimiter: '' })}.ts`
        const queryParamsFilePath = await resolveId({ fileName: queryParamsFileName, directory, pluginName: swaggerZodPluginName })

        imports.push({
          name: [queryParamsName],
          path: getRelativePath(controllerFilePath, queryParamsFilePath),
        })

        parameters.push(`
          {
            name: "${schemas.queryParams.name}",
            description: \`${schemas.queryParams.description || ''}\`,
            type: 'Query',
            schema: ${queryParamsName}
          }
        `)
      }

      return `
        {
          method: \`${operation.method}\`,
          // TODO add utils
          path: \`${operation.path.replaceAll('{', ':').replaceAll('}', '')}\`,
          description: \`${operation.getDescription() || ''}\`,
          requestFormat: "json",
          parameters: [
              ${parameters.join(',')}
          ],
          response: ${responseName},
          errors: []
      }
      
      `
    }
    const definitionsPromises = Object.keys(paths).reduce((acc, path) => {
      const operations = paths[path]

      if (operations.get) {
        acc.push(mapOperationToZodios(operations.get))
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
      path: controllerFilePath,
      fileName,
      source: sources.join('\n'),
      imports,
    }
  }

  async get(operation: Operation, schemas: OperationSchemas): Promise<File | null> {
    return null
  }

  async post(operation: Operation, schemas: OperationSchemas): Promise<File | null> {
    return null
  }

  async put(operation: Operation, schemas: OperationSchemas): Promise<File | null> {
    return null
  }

  async delete(operation: Operation, schemas: OperationSchemas): Promise<File | null> {
    return null
  }
}
