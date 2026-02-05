import { describe, expect, it } from 'vitest'
import type { Plugin, PluginManager } from '@kubb/core'
import { parse } from '@kubb/oas'
import { createReactFabric } from '@kubb/react-fabric'
import { OperationGenerator } from './OperationGenerator.ts'

describe('OperationGenerator default response', () => {
  it('should treat default response as successful when no explicit 2xx responses exist', async () => {
    const spec = {
      openapi: '3.1.0',
      info: { title: 'Test', version: '1.0.0' },
      paths: {
        '/users/search': {
          get: {
            operationId: 'searchUsers',
            responses: {
              '400': { description: 'Bad Request' },
              '401': {
                description: 'Unauthorized',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        error: { type: 'string' },
                      },
                    },
                  },
                },
              },
              default: {
                description: 'Successful response',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        users: { type: 'array' },
                        total: { type: 'number' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    }

    const oas = await parse(spec)
    const operation = oas.operation('/users/search', 'get')
    const fabric = createReactFabric()

    const generator = new OperationGenerator(
      {},
      {
        oas,
        fabric,
        pluginManager: undefined as unknown as PluginManager,
        contentType: 'application/json',
        plugin: {} as Plugin,
        exclude: [],
        include: undefined,
        override: undefined,
        mode: 'split',
      },
    )

    const schemas = generator.getSchemas(operation)

    // When no explicit 2xx responses exist, default should be treated as successful
    expect(schemas.responses).toHaveLength(1)
    expect(schemas.responses[0].statusCode).toBeUndefined() // default has undefined statusCode
    expect(schemas.errors).toHaveLength(2) // 400 and 401
  })

  it('should not include default in successful when explicit 2xx responses exist', async () => {
    const spec = {
      openapi: '3.1.0',
      info: { title: 'Test', version: '1.0.0' },
      paths: {
        '/users': {
          get: {
            operationId: 'getUsers',
            responses: {
              '200': {
                description: 'Success',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        users: { type: 'array' },
                      },
                    },
                  },
                },
              },
              '401': {
                description: 'Unauthorized',
              },
              default: {
                description: 'Error',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        error: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    }

    const oas = await parse(spec)
    const operation = oas.operation('/users', 'get')
    const fabric = createReactFabric()

    const generator = new OperationGenerator(
      {},
      {
        oas,
        fabric,
        pluginManager: undefined as unknown as PluginManager,
        contentType: 'application/json',
        plugin: {} as Plugin,
        exclude: [],
        include: undefined,
        override: undefined,
        mode: 'split',
      },
    )

    const schemas = generator.getSchemas(operation)

    // When explicit 2xx exists, default should NOT be in successful
    expect(schemas.responses).toHaveLength(1)
    expect(schemas.responses[0].statusCode).toBe(200)
    expect(schemas.errors).toHaveLength(1) // only 401
  })
})
