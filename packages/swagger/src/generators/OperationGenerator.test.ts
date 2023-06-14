import { oasParser } from '../parsers/oasParser.ts'
import { definePlugin } from '../plugin.ts'
import { OperationGenerator } from './OperationGenerator.ts'

import type { File } from '@kubb/core'
import type { Operation, Resolver } from '../types.ts'

class DummyOperationGenerator extends OperationGenerator {
  resolve(_operation: Operation): Resolver {
    return {
      fileName: 'fileName.ts',
      filePath: 'models/fileName/ts',
      name: 'fileName',
    }
  }

  all(): Promise<File | null> {
    return Promise.resolve(null)
  }

  get(__operation: Operation): Promise<File | null> {
    return new Promise((resolve) => {
      resolve(null)
    })
  }

  post(_operation: Operation): Promise<File | null> {
    return new Promise((resolve) => {
      resolve(null)
    })
  }

  put(_operation: Operation): Promise<File | null> {
    return new Promise((resolve) => {
      resolve(null)
    })
  }

  delete(_operation: Operation): Promise<File | null> {
    return new Promise((resolve) => {
      resolve(null)
    })
  }

  build(): Promise<File[]> {
    return new Promise((resolve) => {
      resolve([] as File[])
    })
  }
}

const swaggerApi = definePlugin({}).api

describe('abstract class OperationGenerator', () => {
  test('if pathParams return undefined when there are no params in path', async () => {
    const oas = await oasParser({
      root: './',
      output: { path: 'test', clean: true },
      input: { path: 'packages/swagger/mocks/petStore.yaml' },
    })

    const og = new DummyOperationGenerator({ oas })

    expect(og.getSchemas(oas.operation('/pets', 'get')).pathParams).toBeUndefined()
    expect(og.getSchemas(oas.operation('/pets', 'get')).queryParams).toBeDefined()
  })
})
