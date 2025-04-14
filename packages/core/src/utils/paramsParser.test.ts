import { z } from './zod.ts'

import { paramsParser } from './paramsParser.ts'

describe('paramsParser', () => {
  const userSchema = z.object({
    firstName: z.string(),
    address: z.object({
      postalCode: z.string(),
      city: z.string(),
    }),
  })

  const clientDataSchema = z.params([
    z.object({
      firstName: z.string().optional(),
    }),
  ])

  test('useType', () => {
    expect(paramsParser('Test', userSchema, { useType: true })).toMatchInlineSnapshot(
      `"type Test = { firstName: string; address: { postalCode: string; city: string } }"`,
    )
  })

  test('useInterface', () => {
    expect(paramsParser('Test', userSchema, { useInterface: true })).toMatchInlineSnapshot(
      `"interface Test { firstName: string; address: { postalCode: string; city: string } }"`,
    )
  })

  test('variableOnly', () => {
    expect(paramsParser('Test', userSchema, { variableOnly: true })).toMatchInlineSnapshot(
      `"const params: Test = { firstName, address: { postalCode, city } }"`,
    )
  })

  test('functionCall', () => {
    expect(paramsParser('Test', userSchema, { functionCall: true })).toMatchInlineSnapshot(`"{ firstName, address: { postalCode, city } }: Test"`)
    expect(paramsParser('Test', clientDataSchema, { functionCall: true })).toMatchInlineSnapshot(`"{ firstName, data, params, config }: Test"`)
  })

  test('pureObject', () => {
    expect(paramsParser('Test', userSchema, { pureObject: true })).toMatchInlineSnapshot(`"{ firstName, address: { postalCode, city } }"`)
    expect(paramsParser('Test', clientDataSchema, { pureObject: true })).toMatchInlineSnapshot(`"{ firstName, data, params, config }"`)
  })
})
