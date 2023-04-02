import type { File, FileManager, PluginContext } from '@kubb/core'
import { OperationGenerator as Generator } from '@kubb/swagger'
import type { Oas, Operation, OperationSchemas, HttpMethod } from '@kubb/swagger'

type Options = {
  oas: Oas
  directory: string
  fileName: string
  fileManager: FileManager
  resolveId: PluginContext['resolveId']
}

export class OperationGenerator extends Generator<Options> {
  async all(paths: Record<string, Record<HttpMethod, Operation>>): Promise<File | null> {
    const { fileName, directory, resolveId } = this.options

    // controller setup
    const controllerFilePath = await resolveId({
      fileName,
      directory,
    })

    if (!controllerFilePath) {
      return null
    }
    // end controller setup

    const sources: string[] = []

    sources.push(`
      const endpoints = makeApi([]);

      export const api = new Zodios(endpoints);

      export default api;
    `)

    return {
      path: controllerFilePath,
      fileName,
      source: sources.join('\n'),
      imports: [
        {
          name: ['makeApi', 'Zodios', 'ZodiosOptions'],
          path: '@zodios/core',
        },
      ],
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
