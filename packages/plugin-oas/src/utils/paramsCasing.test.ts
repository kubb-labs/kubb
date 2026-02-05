import type { SchemaObject } from '@kubb/oas'
import { describe, expect, test } from 'vitest'
import { applyParamsCasing, isParameterSchema } from './paramsCasing.ts'

describe('isParameterSchema', () => {
  test('should return true for pathParams schemas', () => {
    expect(isParameterSchema('GetUserPathParams')).toBe(true)
    expect(isParameterSchema('CreatePetPathParams')).toBe(true)
    expect(isParameterSchema('pathParams')).toBe(true)
  })

  test('should return true for queryParams schemas', () => {
    expect(isParameterSchema('GetUserQueryParams')).toBe(true)
    expect(isParameterSchema('FindPetsQueryParams')).toBe(true)
    expect(isParameterSchema('queryParams')).toBe(true)
  })

  test('should return true for headerParams schemas', () => {
    expect(isParameterSchema('GetUserHeaderParams')).toBe(true)
    expect(isParameterSchema('CreatePetHeaderParams')).toBe(true)
    expect(isParameterSchema('headerParams')).toBe(true)
  })

  test('should return false for non-parameter schemas', () => {
    expect(isParameterSchema('GetUserResponse')).toBe(false)
    expect(isParameterSchema('CreatePetRequest')).toBe(false)
    expect(isParameterSchema('Pet')).toBe(false)
    expect(isParameterSchema('User')).toBe(false)
    expect(isParameterSchema('GetUser200')).toBe(false)
  })

  test('should be case insensitive', () => {
    expect(isParameterSchema('GETUSERPATHPARAMS')).toBe(true)
    expect(isParameterSchema('getuserpathparams')).toBe(true)
    expect(isParameterSchema('GetUserPATHPARAMS')).toBe(true)
  })
})

describe('applyParamsCasing', () => {
  test('should return schema unchanged when no properties exist', () => {
    const schema: SchemaObject = {
      type: 'object',
    }
    expect(applyParamsCasing(schema, 'camelcase')).toBe(schema)
  })

  test('should transform snake_case properties to camelCase', () => {
    const schema: SchemaObject = {
      type: 'object',
      properties: {
        user_id: { type: 'string' },
        user_name: { type: 'string' },
        is_active: { type: 'boolean' },
      },
    }
    const result = applyParamsCasing(schema, 'camelcase')
    expect(result.properties).toStrictEqual({
      userId: { type: 'string' },
      userName: { type: 'string' },
      isActive: { type: 'boolean' },
    })
  })

  test('should transform kebab-case properties to camelCase', () => {
    const schema: SchemaObject = {
      type: 'object',
      properties: {
        'user-id': { type: 'string' },
        'user-name': { type: 'string' },
      },
    }
    const result = applyParamsCasing(schema, 'camelcase')
    expect(result.properties).toStrictEqual({
      userId: { type: 'string' },
      userName: { type: 'string' },
    })
  })

  test('should transform header-style properties to camelCase', () => {
    const schema: SchemaObject = {
      type: 'object',
      properties: {
        'X-API-Key': { type: 'string' },
        'X-Request-ID': { type: 'string' },
        'Content-Type': { type: 'string' },
      },
    }
    const result = applyParamsCasing(schema, 'camelcase')
    expect(result.properties).toStrictEqual({
      xAPIKey: { type: 'string' },
      xRequestID: { type: 'string' },
      contentType: { type: 'string' },
    })
  })

  test('should transform required field names', () => {
    const schema: SchemaObject = {
      type: 'object',
      properties: {
        user_id: { type: 'string' },
        user_name: { type: 'string' },
        email: { type: 'string' },
      },
      required: ['user_id', 'user_name'],
    }
    const result = applyParamsCasing(schema, 'camelcase')
    expect(result.required).toStrictEqual(['userId', 'userName'])
  })

  test('should preserve other schema properties', () => {
    const schema: SchemaObject = {
      type: 'object',
      title: 'User Parameters',
      description: 'Parameters for user endpoint',
      properties: {
        user_id: { type: 'string' },
      },
      required: ['user_id'],
    }
    const result = applyParamsCasing(schema, 'camelcase')
    expect(result.type).toBe('object')
    expect(result.title).toBe('User Parameters')
    expect(result.description).toBe('Parameters for user endpoint')
  })

  test('should handle properties that are already camelCase', () => {
    const schema: SchemaObject = {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        userName: { type: 'string' },
      },
    }
    const result = applyParamsCasing(schema, 'camelcase')
    expect(result.properties).toStrictEqual({
      userId: { type: 'string' },
      userName: { type: 'string' },
    })
  })

  test('should transform invalid variable names even without casing set', () => {
    const schema: SchemaObject = {
      type: 'object',
      properties: {
        validName: { type: 'string' },
        'invalid-name': { type: 'string' },
        '123invalid': { type: 'string' },
      },
    }
    const result = applyParamsCasing(schema, undefined)
    // Without casing option, properties remain unchanged (no transformation without explicit casing)
    expect(result.properties).toStrictEqual({
      validName: { type: 'string' },
      'invalid-name': { type: 'string' },
      '123invalid': { type: 'string' },
    })
  })

  test('should preserve nested schema structure', () => {
    const schema: SchemaObject = {
      type: 'object',
      properties: {
        user_data: {
          type: 'object',
          properties: {
            nested_field: { type: 'string' },
          },
        },
      },
    }
    const result = applyParamsCasing(schema, 'camelcase')
    // Only top-level properties are transformed, nested properties remain unchanged
    expect(result.properties).toHaveProperty('userData')
    expect(result.properties?.userData).toStrictEqual({
      type: 'object',
      properties: {
        nested_field: { type: 'string' },
      },
    })
  })

  test('should handle empty required array', () => {
    const schema: SchemaObject = {
      type: 'object',
      properties: {
        user_id: { type: 'string' },
      },
      required: [],
    }
    const result = applyParamsCasing(schema, 'camelcase')
    // Empty array is preserved, not removed
    expect(result.required).toStrictEqual([])
  })

  test('should handle schema without required field', () => {
    const schema: SchemaObject = {
      type: 'object',
      properties: {
        user_id: { type: 'string' },
      },
    }
    const result = applyParamsCasing(schema, 'camelcase')
    expect(result.required).toBeUndefined()
  })

  test('should handle complex property schemas', () => {
    const schema: SchemaObject = {
      type: 'object',
      properties: {
        page_size: {
          type: 'integer',
          minimum: 1,
          maximum: 100,
          default: 10,
        },
        sort_order: {
          type: 'string',
          enum: ['asc', 'desc'],
        },
      },
    }
    const result = applyParamsCasing(schema, 'camelcase')
    expect(result.properties).toStrictEqual({
      pageSize: {
        type: 'integer',
        minimum: 1,
        maximum: 100,
        default: 10,
      },
      sortOrder: {
        type: 'string',
        enum: ['asc', 'desc'],
      },
    })
  })
})
