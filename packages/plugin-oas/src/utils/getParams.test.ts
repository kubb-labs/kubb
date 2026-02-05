import { describe, expect, test } from 'vitest'
import type { OperationSchema } from '../types.ts'
import { getParamsMapping, getPathParams } from './getParams.ts'

describe('getParamsMapping', () => {
  test('should return undefined when no transformation needed (all valid names)', () => {
    const schema = {
      name: 'TestParams',
      schema: {
        type: 'object',
        properties: {
          userId: { type: 'string' },
          userName: { type: 'string' },
        },
      },
    } as unknown as OperationSchema
    expect(getParamsMapping(schema)).toBeUndefined()
  })

  test('should map snake_case to camelCase when casing is "camelcase"', () => {
    const schema = {
      name: 'TestParams',
      schema: {
        type: 'object',
        properties: {
          user_id: { type: 'string' },
          user_name: { type: 'string' },
        },
      },
    } as unknown as OperationSchema
    expect(getParamsMapping(schema, { casing: 'camelcase' })).toStrictEqual({
      user_id: 'userId',
      user_name: 'userName',
    })
  })

  test('should map kebab-case to camelCase when casing is "camelcase"', () => {
    const schema = {
      name: 'TestParams',
      schema: {
        type: 'object',
        properties: {
          'user-id': { type: 'string' },
          'user-name': { type: 'string' },
        },
      },
    } as unknown as OperationSchema
    expect(getParamsMapping(schema, { casing: 'camelcase' })).toStrictEqual({
      'user-id': 'userId',
      'user-name': 'userName',
    })
  })

  test('should map header names to camelCase when casing is "camelcase"', () => {
    const schema = {
      name: 'HeaderParams',
      schema: {
        type: 'object',
        properties: {
          'X-API-Key': { type: 'string' },
          'X-Request-ID': { type: 'string' },
          'Content-Type': { type: 'string' },
        },
      },
    } as unknown as OperationSchema
    expect(getParamsMapping(schema, { casing: 'camelcase' })).toStrictEqual({
      'X-API-Key': 'xAPIKey',
      'X-Request-ID': 'xRequestID',
      'Content-Type': 'contentType',
    })
  })

  test('should handle mixed valid and invalid variable names without casing option', () => {
    const schema = {
      name: 'TestParams',
      schema: {
        type: 'object',
        properties: {
          validName: { type: 'string' },
          'invalid-name': { type: 'string' },
          '123invalid': { type: 'string' },
        },
      },
    } as unknown as OperationSchema
    // Without casing, only invalid var names are transformed
    expect(getParamsMapping(schema)).toStrictEqual({
      'invalid-name': 'invalidName',
      '123invalid': '123Invalid',
    })
  })

  test('should handle special characters in parameter names', () => {
    const schema = {
      name: 'TestParams',
      schema: {
        type: 'object',
        properties: {
          'param.with.dots': { type: 'string' },
          param$with$dollar: { type: 'string' },
        },
      },
    } as unknown as OperationSchema
    expect(getParamsMapping(schema, { casing: 'camelcase' })).toStrictEqual({
      'param.with.dots': 'paramWithDots',
      // Dollar signs are not treated as word separators by camelCase
      param$with$dollar: 'paramwithdollar',
    })
  })

  test('should return undefined when all names are already camelCase', () => {
    const schema = {
      name: 'TestParams',
      schema: {
        type: 'object',
        properties: {
          userId: { type: 'string' },
          userName: { type: 'string' },
          userEmail: { type: 'string' },
        },
      },
    } as unknown as OperationSchema
    expect(getParamsMapping(schema, { casing: 'camelcase' })).toBeUndefined()
  })

  test('should handle boolean parameter names correctly', () => {
    const schema = {
      name: 'QueryParams',
      schema: {
        type: 'object',
        properties: {
          bool_param: { type: 'boolean' },
          is_active: { type: 'boolean' },
        },
      },
    } as unknown as OperationSchema
    expect(getParamsMapping(schema, { casing: 'camelcase' })).toStrictEqual({
      bool_param: 'boolParam',
      is_active: 'isActive',
    })
  })

  test('should handle empty properties object', () => {
    const schema = {
      name: 'TestParams',
      schema: {
        type: 'object',
        properties: {},
      },
    } as unknown as OperationSchema
    expect(getParamsMapping(schema)).toBeUndefined()
  })

  test('should handle numbers in parameter names', () => {
    const schema = {
      name: 'TestParams',
      schema: {
        type: 'object',
        properties: {
          step_1_id: { type: 'string' },
          version_2_0: { type: 'string' },
        },
      },
    } as unknown as OperationSchema
    expect(getParamsMapping(schema, { casing: 'camelcase' })).toStrictEqual({
      step_1_id: 'step1Id',
      version_2_0: 'version20',
    })
  })

  test('should handle consecutive underscores', () => {
    const schema = {
      name: 'TestParams',
      schema: {
        type: 'object',
        properties: {
          user__id: { type: 'string' },
          test___value: { type: 'string' },
        },
      },
    } as unknown as OperationSchema
    expect(getParamsMapping(schema, { casing: 'camelcase' })).toStrictEqual({
      user__id: 'userId',
      test___value: 'testValue',
    })
  })

  test('should handle uppercase parameter names', () => {
    const schema = {
      name: 'TestParams',
      schema: {
        type: 'object',
        properties: {
          UPPERCASE_PARAM: { type: 'string' },
          MixedCase_Param: { type: 'string' },
        },
      },
    } as unknown as OperationSchema
    expect(getParamsMapping(schema, { casing: 'camelcase' })).toStrictEqual({
      // All uppercase words are treated as a single word by camelCase
      UPPERCASE_PARAM: 'UPPERCASEPARAM',
      MixedCase_Param: 'mixedCaseParam',
    })
  })

  test('should handle parameter names with leading/trailing underscores', () => {
    const schema = {
      name: 'TestParams',
      schema: {
        type: 'object',
        properties: {
          _leadingUnderscore: { type: 'string' },
          trailingUnderscore_: { type: 'string' },
          _both_: { type: 'string' },
        },
      },
    } as unknown as OperationSchema
    expect(getParamsMapping(schema, { casing: 'camelcase' })).toStrictEqual({
      _leadingUnderscore: 'leadingUnderscore',
      trailingUnderscore_: 'trailingUnderscore',
      _both_: 'both',
    })
  })
})

describe('getPathParams', () => {
  test('should return empty object when operationSchema is undefined', () => {
    expect(getPathParams(undefined)).toStrictEqual({})
  })

  test('should return empty object when schema has no properties', () => {
    const schema = {
      name: 'TestParams',
      schema: {},
    } as unknown as OperationSchema
    expect(getPathParams(schema)).toStrictEqual({})
  })

  test('should transform parameter names to camelCase when casing is "camelcase"', () => {
    const schema = {
      name: 'PathParams',
      schema: {
        type: 'object',
        properties: {
          user_id: { type: 'string' },
          post_id: { type: 'string' },
        },
        required: ['user_id'],
      },
    } as unknown as OperationSchema
    const result = getPathParams(schema, { casing: 'camelcase', typed: true })
    expect(result).toStrictEqual({
      userId: {
        type: 'PathParams["userId"]',
        optional: false,
        default: undefined,
      },
      postId: {
        type: 'PathParams["postId"]',
        optional: true,
        default: undefined,
      },
    })
  })

  test('should handle required and optional parameters correctly', () => {
    const schema = {
      name: 'PathParams',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          slug: { type: 'string' },
          category: { type: 'string' },
        },
        required: ['id', 'slug'],
      },
    } as unknown as OperationSchema
    const result = getPathParams(schema, { typed: true })
    expect(result).toStrictEqual({
      id: {
        type: 'PathParams["id"]',
        optional: false,
        default: undefined,
      },
      slug: {
        type: 'PathParams["slug"]',
        optional: false,
        default: undefined,
      },
      category: {
        type: 'PathParams["category"]',
        optional: true,
        default: undefined,
      },
    })
  })

  test('should transform invalid variable names even without casing option', () => {
    const schema = {
      name: 'PathParams',
      schema: {
        type: 'object',
        properties: {
          'pet-id': { type: 'string' },
          'X-Header': { type: 'string' },
        },
      },
    } as unknown as OperationSchema
    const result = getPathParams(schema, { typed: true })
    expect(result).toStrictEqual({
      petId: {
        // Type uses original property name since accessName is based on original name in getASTParams
        type: 'PathParams["pet-id"]',
        optional: true,
        default: undefined,
      },
      xHeader: {
        type: 'PathParams["X-Header"]',
        optional: true,
        default: undefined,
      },
    })
  })

  test('should work without typed option', () => {
    const schema = {
      name: 'PathParams',
      schema: {
        type: 'object',
        properties: {
          user_id: { type: 'string' },
        },
        required: ['user_id'],
      },
    } as unknown as OperationSchema
    const result = getPathParams(schema, { casing: 'camelcase' })
    expect(result).toStrictEqual({
      userId: {
        optional: false,
        type: undefined,
        default: undefined,
      },
    })
  })

  test('should handle override function', () => {
    const schema = {
      name: 'PathParams',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
    } as unknown as OperationSchema
    const result = getPathParams(schema, {
      typed: true,
      override: (data) => ({ ...data, default: "'default-value'" }),
    })
    expect(result).toStrictEqual({
      id: {
        type: 'PathParams["id"]',
        optional: false,
        default: "'default-value'",
      },
    })
  })

  test('should handle complex real-world example with mixed params', () => {
    const schema = {
      name: 'ComplexParams',
      schema: {
        type: 'object',
        properties: {
          user_id: { type: 'string' },
          'X-Auth-Token': { type: 'string' },
          pageSize: { type: 'number' },
          'filter.name': { type: 'string' },
        },
        required: ['user_id', 'X-Auth-Token'],
      },
    } as unknown as OperationSchema
    const result = getPathParams(schema, { casing: 'camelcase', typed: true })
    expect(result).toStrictEqual({
      userId: {
        type: 'ComplexParams["userId"]',
        optional: false,
        default: undefined,
      },
      xAuthToken: {
        type: 'ComplexParams["xAuthToken"]',
        optional: false,
        default: undefined,
      },
      pageSize: {
        type: 'ComplexParams["pageSize"]',
        optional: true,
        default: undefined,
      },
      filterName: {
        type: 'ComplexParams["filterName"]',
        optional: true,
        default: undefined,
      },
    })
  })
})
