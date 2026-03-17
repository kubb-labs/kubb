import { createSchema } from './factory.ts'
import type { ParameterNode, SchemaNode } from './nodes/index.ts'
import { describe, expect, it } from 'vitest'
import { groupParametersByLocation } from './utils.ts'

describe('groupParametersByLocation', () => {
  function makeParam(name: string, location: 'path' | 'query' | 'header' | 'cookie'): ParameterNode {
    return {
      kind: 'Parameter',
      name,
      in: location,
      required: true,
      schema: createSchema({ type: 'string' }) as SchemaNode,
    }
  }

  it('returns an empty object for an empty array', () => {
    expect(groupParametersByLocation([])).toEqual({})
  })

  it('groups parameters by their location', () => {
    const params = [makeParam('id', 'path'), makeParam('search', 'query'), makeParam('name', 'path')]
    const result = groupParametersByLocation(params)

    expect(Object.keys(result)).toEqual(['path', 'query'])
    expect(result['path']).toHaveLength(2)
    expect(result['query']).toHaveLength(1)
    expect(result['path']![0]!.name).toBe('id')
    expect(result['path']![1]!.name).toBe('name')
  })

  it('handles a single location', () => {
    const params = [makeParam('a', 'header'), makeParam('b', 'header')]
    const result = groupParametersByLocation(params)

    expect(Object.keys(result)).toEqual(['header'])
    expect(result['header']).toHaveLength(2)
  })
})
