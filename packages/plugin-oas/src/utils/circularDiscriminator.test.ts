import type { Plugin } from '@kubb/core'
import type { OasTypes } from '@kubb/oas'
import { parse } from '@kubb/oas'
import { createReactFabric } from '@kubb/react-fabric'
import type { PluginManager } from '@kubb/core'
import { camelCase, pascalCase } from '@kubb/core/transformers'
import { describe, expect, it } from 'vitest'
import { SchemaGenerator, type GetSchemaGeneratorOptions } from '../SchemaGenerator.ts'

// Simple mocked plugin manager for testing
const createMockedPluginManager = () =>
  ({
    resolveName: (result: { name: string; type: string }) => {
      if (result.type === 'file') {
        return camelCase(result.name)
      }
      if (result.type === 'type') {
        return pascalCase(result.name)
      }
      return camelCase(result.name)
    },
    config: {
      root: '.',
      output: { path: './path' },
    },
    resolvePath: ({ baseName }: { baseName: string }) => baseName,
    logger: {
      emit() {},
      on() {},
      logLevel: 3,
    },
    getPluginByKey: () => undefined,
    getFile: ({ name, extname, pluginKey }: { name: string; extname: string; pluginKey: any }) => {
      const baseName = `${name}${extname}`
      return { path: baseName, baseName, meta: { pluginKey } }
    },
  }) as unknown as PluginManager

describe('Circular Discriminator References', () => {
  it('should not create circular references when child extends discriminator parent via allOf', async () => {
    const spec: OasTypes.OASDocument = {
      openapi: '3.0.1',
      info: { title: 'Test', version: '1.0' },
      paths: {},
      components: {
        schemas: {
          PaymentAccountDetailsResponse: {
            type: 'object',
            discriminator: {
              propertyName: 'type',
              mapping: {
                ACH: '#/components/schemas/ACHDetailsResponse',
                DOMESTIC_WIRE: '#/components/schemas/DomesticWireDetailsResponse',
              },
            },
            oneOf: [
              { $ref: '#/components/schemas/ACHDetailsResponse' },
              { $ref: '#/components/schemas/DomesticWireDetailsResponse' },
            ],
          },
          ACHDetailsResponse: {
            type: 'object',
            allOf: [
              { $ref: '#/components/schemas/PaymentAccountDetailsResponse' },
              {
                required: ['type', 'account_number'],
                properties: {
                  type: { type: 'string', enum: ['ACH'] },
                  account_number: { type: 'string' },
                },
              },
            ],
          },
          DomesticWireDetailsResponse: {
            type: 'object',
            allOf: [
              { $ref: '#/components/schemas/PaymentAccountDetailsResponse' },
              {
                required: ['type', 'routing_number'],
                properties: {
                  type: { type: 'string', enum: ['DOMESTIC_WIRE'] },
                  routing_number: { type: 'string' },
                },
              },
            ],
          },
        },
      },
    }

    const oas = await parse(spec)
    const schemas = oas.getDefinition().components?.schemas

    const options: GetSchemaGeneratorOptions<SchemaGenerator> = {
      dateType: 'date',
      unknownType: 'unknown',
      emptySchemaType: 'unknown',
      transformers: {},
    }
    const plugin = { options } as Plugin<any>
    const fabric = createReactFabric()
    const mockedPluginManager = createMockedPluginManager()

    const generator = new SchemaGenerator(options, {
      fabric,
      oas,
      include: undefined,
      pluginManager: mockedPluginManager,
      plugin,
      contentType: undefined,
      override: undefined,
      mode: 'split',
    })

    // Parse ACHDetailsResponse - this should NOT have a circular reference
    const achSchema = schemas?.['ACHDetailsResponse']
    const achTree = generator.parse({ schemaObject: achSchema, name: 'ACHDetailsResponse' })

    // The tree should contain a ref to PaymentAccountDetailsResponse WITHOUT an additional 'and' with discriminator const
    // It should be: and(ref(PaymentAccountDetailsResponse), object({...}))
    // NOT: and(and(ref(PaymentAccountDetailsResponse), object({type: 'ACH'})), object({...}))
    expect(achTree).toMatchSnapshot('ACHDetailsResponse-tree')

    // Parse DomesticWireDetailsResponse similarly
    const wireSchema = schemas?.['DomesticWireDetailsResponse']
    const wireTree = generator.parse({ schemaObject: wireSchema, name: 'DomesticWireDetailsResponse' })
    expect(wireTree).toMatchSnapshot('DomesticWireDetailsResponse-tree')

    // Parse PaymentAccountDetailsResponse - the union type should work correctly
    const parentSchema = schemas?.['PaymentAccountDetailsResponse']
    const parentTree = generator.parse({ schemaObject: parentSchema, name: 'PaymentAccountDetailsResponse' })
    expect(parentTree).toMatchSnapshot('PaymentAccountDetailsResponse-tree')
  })

  it('should still add discriminator constraint for non-allOf references', async () => {
    // This tests that we don't break the case where a property references a discriminator type
    const spec: OasTypes.OASDocument = {
      openapi: '3.0.1',
      info: { title: 'Test', version: '1.0' },
      paths: {},
      components: {
        schemas: {
          Payment: {
            type: 'object',
            properties: {
              account: { $ref: '#/components/schemas/PaymentAccountDetailsResponse' },
            },
          },
          PaymentAccountDetailsResponse: {
            type: 'object',
            discriminator: {
              propertyName: 'type',
              mapping: {
                ACH: '#/components/schemas/ACHDetailsResponse',
              },
            },
            oneOf: [{ $ref: '#/components/schemas/ACHDetailsResponse' }],
          },
          ACHDetailsResponse: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['ACH'] },
              account_number: { type: 'string' },
            },
          },
        },
      },
    }

    const oas = await parse(spec)
    const schemas = oas.getDefinition().components?.schemas

    const options: GetSchemaGeneratorOptions<SchemaGenerator> = {
      dateType: 'date',
      unknownType: 'unknown',
      emptySchemaType: 'unknown',
      transformers: {},
    }
    const plugin = { options } as Plugin<any>
    const fabric = createReactFabric()
    const mockedPluginManager = createMockedPluginManager()

    const generator = new SchemaGenerator(options, {
      fabric,
      oas,
      include: undefined,
      pluginManager: mockedPluginManager,
      plugin,
      contentType: undefined,
      override: undefined,
      mode: 'split',
    })

    // Parse Payment schema - reference to discriminator should work without issues
    const paymentSchema = schemas?.['Payment']
    const paymentTree = generator.parse({ schemaObject: paymentSchema, name: 'Payment' })
    expect(paymentTree).toMatchSnapshot('Payment-tree')
  })
})
