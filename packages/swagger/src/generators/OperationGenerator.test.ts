import { oasParser } from '../parsers/oasParser.ts'
import { OperationGenerator } from './OperationGenerator.ts'

import type { KubbFile } from '@kubb/core'
import type { Operation, Resolver } from '../types.ts'

class DummyOperationGenerator extends OperationGenerator {
  resolve(_operation: Operation): Resolver {
    return {
      baseName: 'fileName.ts',
      path: 'models/fileName/ts',
      name: 'fileName',
    }
  }

  all(): Promise<KubbFile.File | null> {
    return Promise.resolve(null)
  }

  get(operation: Operation): Promise<KubbFile.File | null> {
    return new Promise((resolve) => {
      const baseName: `${string}.ts` = `${operation.getOperationId()}.ts`
      resolve({ baseName, path: baseName, source: '' })
    })
  }

  post(_operation: Operation): Promise<KubbFile.File | null> {
    return new Promise((resolve) => {
      resolve(null)
    })
  }
  patch(_operation: Operation): Promise<KubbFile.File | null> {
    return new Promise((resolve) => {
      resolve(null)
    })
  }

  put(_operation: Operation): Promise<KubbFile.File | null> {
    return new Promise((resolve) => {
      resolve(null)
    })
  }

  delete(_operation: Operation): Promise<KubbFile.File | null> {
    return new Promise((resolve) => {
      resolve(null)
    })
  }
}

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

  test('if skipBy is filtered out for tag', async () => {
    const oas = await oasParser({
      root: './',
      output: { path: 'test', clean: true },
      input: { path: 'packages/swagger/mocks/petStore.yaml' },
    })

    const og = new DummyOperationGenerator({
      oas,
      skipBy: [
        {
          type: 'tag',
          pattern: 'pets',
        },
      ],
    })

    const files = await og.build()

    expect(files).toMatchObject([])
  })

  test('if skipBy is filtered out for operationId', async () => {
    const oas = await oasParser({
      root: './',
      output: { path: 'test', clean: true },
      input: { path: 'packages/swagger/mocks/petStore.yaml' },
    })

    const og = new DummyOperationGenerator({
      oas,
      skipBy: [
        {
          type: 'operationId',
          pattern: 'listPets',
        },
      ],
    })

    const files = await og.build()

    expect(files).toMatchObject([
      {
        fileName: 'showPetById.ts',
        path: 'showPetById.ts',
        source: '',
      },
    ])
  })

  test('if skipBy is filtered out for path', async () => {
    const oas = await oasParser({
      root: './',
      output: { path: 'test', clean: true },
      input: { path: 'packages/swagger/mocks/petStore.yaml' },
    })

    const og = new DummyOperationGenerator({
      oas,
      skipBy: [
        {
          type: 'path',
          pattern: '/pets/{petId}',
        },
      ],
    })

    const files = await og.build()

    expect(files).toMatchObject([
      {
        fileName: 'listPets.ts',
        path: 'listPets.ts',
        source: '',
      },
    ])
  })

  test('if skipBy is filtered out for method', async () => {
    const oas = await oasParser({
      root: './',
      output: { path: 'test', clean: true },
      input: { path: 'packages/swagger/mocks/petStore.yaml' },
    })

    const og = new DummyOperationGenerator({
      oas,
      skipBy: [
        {
          type: 'method',
          pattern: 'get',
        },
      ],
    })

    const files = await og.build()

    expect(files).toMatchObject([])
  })

  test('if skipBy is filtered out for path and operationId', async () => {
    const oas = await oasParser({
      root: './',
      output: { path: 'test', clean: true },
      input: { path: 'packages/swagger/mocks/petStore.yaml' },
    })

    const og = new DummyOperationGenerator({
      oas,
      skipBy: [
        {
          type: 'path',
          pattern: '/pets/{petId}',
        },
        {
          type: 'operationId',
          pattern: 'listPets',
        },
      ],
    })

    const files = await og.build()

    expect(files).toMatchObject([])
  })
})
