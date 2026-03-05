import { describe, test } from 'vitest'
import { pascalCase, camelCase } from '@kubb/core/transformers'

describe('naming', () => {
  test('pascalCase with empty suffix', () => {
    const suffix = ''
    const result1 = pascalCase(['Action', 'type', suffix].join(' '))
    const result2 = pascalCase(['Action', 'type', 'enum'].join(' '))
    console.log('With empty suffix:', result1)
    console.log('With enum suffix:', result2)
    console.log('camelCase of result1:', camelCase(result1))
    console.log('camelCase of result2:', camelCase(result2))
    
    // What if parent is null?
    const result3 = pascalCase([null, 'EmptyEnum', suffix].filter(Boolean).join(' '))
    console.log('Null parent, EmptyEnum name:', result3)
    
    const result4 = pascalCase([null, 'EmptyEnum', 'enum'].filter(Boolean).join(' '))
    console.log('Null parent, EmptyEnum name, enum suffix:', result4)
  })
})
