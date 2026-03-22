import { createSchema } from '@kubb/ast'
import { describe, expect, it } from 'vitest'
import type { NamingConfig } from './naming.ts'
import { applyEnumName, resolveChildName, resolveEnumPropName } from './naming.ts'

function createConfig(overrides?: Partial<NamingConfig>): NamingConfig {
  return {
    isLegacyNaming: false,
    usedEnumNames: {},
    ...overrides,
  }
}

describe('resolveChildName', () => {
  it('combines parent and prop into PascalCase when parent is present', () => {
    const result = resolveChildName({ config: createConfig(), parentName: 'Article', propName: 'ageGroups' })
    expect(result).toBe('ArticleAgeGroups')
  })

  it('returns undefined when parent is absent in non-legacy mode', () => {
    const result = resolveChildName({ config: createConfig(), parentName: undefined, propName: 'ageGroups' })
    expect(result).toBeUndefined()
  })

  it('returns PascalCase prop name when parent is absent in legacy mode', () => {
    const result = resolveChildName({ config: createConfig({ isLegacyNaming: true }), parentName: undefined, propName: 'ageGroups' })
    expect(result).toBe('AgeGroups')
  })

  it('returns PascalCase when parent is present in legacy mode', () => {
    const result = resolveChildName({ config: createConfig({ isLegacyNaming: true }), parentName: 'Article', propName: 'status' })
    expect(result).toBe('ArticleStatus')
  })

  it('handles multi-word prop names', () => {
    const result = resolveChildName({ config: createConfig(), parentName: 'User', propName: 'first_name' })
    expect(result).toBe('UserFirstName')
  })
})

describe('resolveEnumPropName', () => {
  it('builds PascalCase name from parent, prop, and suffix', () => {
    const result = resolveEnumPropName({ config: createConfig(), parentName: 'User', propName: 'status', enumSuffix: 'enum' })
    expect(result).toBe('UserStatusEnum')
  })

  it('omits parent when undefined', () => {
    const result = resolveEnumPropName({ config: createConfig(), parentName: undefined, propName: 'status', enumSuffix: 'enum' })
    expect(result).toBe('StatusEnum')
  })

  it('deduplicates in legacy mode', () => {
    const usedEnumNames: Record<string, number> = {}
    const config = createConfig({ isLegacyNaming: true, usedEnumNames })

    const first = resolveEnumPropName({ config, parentName: 'User', propName: 'status', enumSuffix: 'enum' })
    expect(first).toBe('UserStatusEnum')

    const second = resolveEnumPropName({ config, parentName: 'User', propName: 'status', enumSuffix: 'enum' })
    expect(second).toBe('UserStatusEnum2')
  })

  it('does not deduplicate in non-legacy mode', () => {
    const config = createConfig({ isLegacyNaming: false })

    const first = resolveEnumPropName({ config, parentName: 'User', propName: 'status', enumSuffix: 'enum' })
    const second = resolveEnumPropName({ config, parentName: 'User', propName: 'status', enumSuffix: 'enum' })
    expect(first).toBe(second)
  })

  it('handles empty enum suffix', () => {
    const result = resolveEnumPropName({ config: createConfig(), parentName: 'User', propName: 'status', enumSuffix: '' })
    expect(result).toBe('UserStatus')
  })
})

describe('applyEnumName', () => {
  it('assigns resolved name to enum nodes', () => {
    const enumNode = createSchema({ type: 'enum', primitive: 'string', enumValues: ['active', 'inactive'] })
    const result = applyEnumName({
      config: createConfig(),
      propNode: enumNode,
      parentName: 'User',
      propName: 'status',
      enumSuffix: 'enum',
    })
    expect(result.name).toBe('UserStatusEnum')
  })

  it('strips name from boolean-primitive enum nodes (always inlined)', () => {
    const boolEnum = createSchema({ type: 'enum', primitive: 'boolean', enumValues: [true, false], name: 'ShouldBeStripped' })
    const result = applyEnumName({
      config: createConfig(),
      propNode: boolEnum,
      parentName: 'User',
      propName: 'isActive',
      enumSuffix: 'enum',
    })
    expect(result.name).toBeUndefined()
  })

  it('passes through non-enum nodes unchanged', () => {
    const stringNode = createSchema({ type: 'string', primitive: 'string', name: 'myProp' })
    const result = applyEnumName({
      config: createConfig(),
      propNode: stringNode,
      parentName: 'User',
      propName: 'name',
      enumSuffix: 'enum',
    })
    expect(result).toBe(stringNode)
  })

  it('works without parent name', () => {
    const enumNode = createSchema({ type: 'enum', primitive: 'string', enumValues: ['a', 'b'] })
    const result = applyEnumName({
      config: createConfig(),
      propNode: enumNode,
      parentName: undefined,
      propName: 'color',
      enumSuffix: 'enum',
    })
    expect(result.name).toBe('ColorEnum')
  })

  it('deduplicates enum names in legacy mode', () => {
    const usedEnumNames: Record<string, number> = {}
    const config = createConfig({ isLegacyNaming: true, usedEnumNames })

    const enum1 = createSchema({ type: 'enum', primitive: 'string', enumValues: ['a'] })
    const enum2 = createSchema({ type: 'enum', primitive: 'string', enumValues: ['b'] })

    const result1 = applyEnumName({ config, propNode: enum1, parentName: 'Type', propName: 'status', enumSuffix: 'enum' })
    const result2 = applyEnumName({ config, propNode: enum2, parentName: 'Type', propName: 'status', enumSuffix: 'enum' })

    expect(result1.name).toBe('TypeStatusEnum')
    expect(result2.name).toBe('TypeStatusEnum2')
  })
})
