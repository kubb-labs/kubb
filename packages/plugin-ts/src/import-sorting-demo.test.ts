import { print } from '@kubb/fabric-core/parsers/typescript'
import { describe, expect, test } from 'vitest'
import { createExportDeclaration, createImportDeclaration } from './factory.ts'

describe('Import/Export Sorting Consistency', () => {
  test('imports with different input order should produce identical sorted output', () => {
    const import1 = createImportDeclaration({
      name: ['zebra', 'apple', 'banana', 'cat'],
      path: './test.ts',
    })

    const import2 = createImportDeclaration({
      name: ['cat', 'banana', 'zebra', 'apple'],
      path: './test.ts',
    })

    const output1 = print(import1)
    const output2 = print(import2)

    // Both should produce the same sorted output
    expect(output1).toBe(output2)
    expect(output1).toContain('apple, banana, cat, zebra')
  })

  test('exports with different input order should produce identical sorted output', () => {
    const export1 = createExportDeclaration({
      name: ['zoo', 'apple', 'monkey'],
      path: './animals.ts',
    })

    const export2 = createExportDeclaration({
      name: ['monkey', 'zoo', 'apple'],
      path: './animals.ts',
    })

    const output1 = print(export1)
    const output2 = print(export2)

    // Both should produce the same sorted output
    expect(output1).toBe(output2)
    expect(output1).toContain('apple, monkey, zoo')
  })

  test('mixed string and object imports should be sorted by property name', () => {
    const import1 = createImportDeclaration({
      name: ['zoo', { propertyName: 'apple' }, 'monkey', { propertyName: 'banana', name: 'yellow' }],
      path: './mixed.ts',
    })

    const output = print(import1)

    // Should be sorted alphabetically: apple, banana as yellow, monkey, zoo
    expect(output).toContain('apple, banana as yellow, monkey, zoo')
  })

  test('demonstrates consistency across different orders - real world scenario', () => {
    // Simulating how imports might be collected on different OS/filesystem orders
    const linuxOrder = ['UserService', 'AuthService', 'DatabaseService', 'CacheService']
    const windowsOrder = ['CacheService', 'UserService', 'DatabaseService', 'AuthService']
    const macOrder = ['DatabaseService', 'AuthService', 'CacheService', 'UserService']

    const import1 = createImportDeclaration({ name: linuxOrder, path: './services.ts' })
    const import2 = createImportDeclaration({ name: windowsOrder, path: './services.ts' })
    const import3 = createImportDeclaration({ name: macOrder, path: './services.ts' })

    const output1 = print(import1)
    const output2 = print(import2)
    const output3 = print(import3)

    // All three should produce identical output regardless of input order
    expect(output1).toBe(output2)
    expect(output2).toBe(output3)
    expect(output1).toContain('AuthService, CacheService, DatabaseService, UserService')
  })
})
