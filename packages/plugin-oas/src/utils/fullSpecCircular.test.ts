import type { Plugin, PluginManager } from '@kubb/core'
import type { OasTypes } from '@kubb/oas'
import { parse } from '@kubb/oas'
import { createReactFabric } from '@kubb/react-fabric'
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
    getFile: ({ name, extname, pluginKey }: { name: string; extname: string; pluginKey: Plugin['key'] | undefined }) => {
      const baseName = `${name}${extname}`
      return { path: baseName, baseName, meta: { pluginKey } }
    },
  }) as unknown as PluginManager

describe('Full Spec Circular Discriminator References', () => {
  it('should handle full PaymentAccountDetailsResponse spec without circular refs', async () => {
    const spec: OasTypes.OASDocument = {
      openapi: '3.0.1',
      info: { title: 'Payments API', version: '1.0' },
      paths: {},
      components: {
        schemas: {
          PaymentDetailsTypeResponse: {
            type: 'string',
            enum: ['ACH', 'DOMESTIC_WIRE', 'CHEQUE', 'INTERNATIONAL_WIRE']
          },
          AccountType: { type: 'string', enum: ['CHECKING', 'SAVING'] },
          AccountClass: { type: 'string', enum: ['BUSINESS', 'PERSONAL'] },
          Address: { type: 'object', properties: { line1: { type: 'string', nullable: true } } },
          PaymentAccountDetailsResponse: {
            type: 'object',
            discriminator: {
              propertyName: 'type',
              mapping: {
                DOMESTIC_WIRE: '#/components/schemas/DomesticWireDetailsResponse',
                ACH: '#/components/schemas/ACHDetailsResponse',
                CHEQUE: '#/components/schemas/ChequeDetailsResponse',
                INTERNATIONAL_WIRE: '#/components/schemas/InternationalWireDetailsResponse'
              }
            },
            oneOf: [
              { $ref: '#/components/schemas/ACHDetailsResponse' },
              { $ref: '#/components/schemas/DomesticWireDetailsResponse' },
              { $ref: '#/components/schemas/ChequeDetailsResponse' },
              { $ref: '#/components/schemas/InternationalWireDetailsResponse' }
            ]
          },
          ACHDetailsResponse: {
            type: 'object',
            allOf: [
              { $ref: '#/components/schemas/PaymentAccountDetailsResponse' },
              {
                required: ['account_number', 'payment_instrument_id', 'routing_number', 'type'],
                properties: {
                  type: { $ref: '#/components/schemas/PaymentDetailsTypeResponse' },
                  payment_instrument_id: { type: 'string' },
                  routing_number: { type: 'string' },
                  account_number: { type: 'string' },
                  account_type: { nullable: true, allOf: [{ $ref: '#/components/schemas/AccountType' }] },
                  account_class: { nullable: true, allOf: [{ $ref: '#/components/schemas/AccountClass' }] }
                }
              }
            ]
          },
          DomesticWireDetailsResponse: {
            type: 'object',
            allOf: [
              { $ref: '#/components/schemas/PaymentAccountDetailsResponse' },
              {
                required: ['account_number', 'address', 'payment_instrument_id', 'routing_number', 'type'],
                properties: {
                  type: { $ref: '#/components/schemas/PaymentDetailsTypeResponse' },
                  payment_instrument_id: { type: 'string' },
                  routing_number: { type: 'string' },
                  account_number: { type: 'string' },
                  address: { $ref: '#/components/schemas/Address' }
                }
              }
            ]
          },
          ChequeDetailsResponse: {
            type: 'object',
            allOf: [
              { $ref: '#/components/schemas/PaymentAccountDetailsResponse' },
              {
                required: ['mailing_address', 'payment_instrument_id', 'recipient_name', 'type'],
                properties: {
                  type: { $ref: '#/components/schemas/PaymentDetailsTypeResponse' },
                  payment_instrument_id: { type: 'string' },
                  mailing_address: { $ref: '#/components/schemas/Address' },
                  recipient_name: { type: 'string' }
                }
              }
            ]
          },
          InternationalWireDetailsResponse: {
            type: 'object',
            allOf: [
              { $ref: '#/components/schemas/PaymentAccountDetailsResponse' },
              {
                required: ['address', 'iban', 'payment_instrument_id', 'swift_code', 'type'],
                properties: {
                  type: { $ref: '#/components/schemas/PaymentDetailsTypeResponse' },
                  payment_instrument_id: { type: 'string' },
                  swift_code: { type: 'string' },
                  iban: { type: 'string' },
                  beneficiary_bank_name: { type: 'string', nullable: true },
                  address: { $ref: '#/components/schemas/Address' }
                }
              }
            ]
          }
        }
      }
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

    // Parse ACHDetailsResponse - check it doesn't have nested and(and(...)) structure
    const achSchema = schemas?.['ACHDetailsResponse']
    const achTree = generator.parse({ schemaObject: achSchema, name: 'ACHDetailsResponse' })
    console.log('ACH Tree:', JSON.stringify(achTree, null, 2))
    expect(achTree).toMatchSnapshot('ACHDetailsResponse-tree')

    // Parse PaymentAccountDetailsResponse  
    const parentSchema = schemas?.['PaymentAccountDetailsResponse']
    const parentTree = generator.parse({ schemaObject: parentSchema, name: 'PaymentAccountDetailsResponse' })
    console.log('Parent Tree:', JSON.stringify(parentTree, null, 2))
    expect(parentTree).toMatchSnapshot('PaymentAccountDetailsResponse-tree')
  })
})
