import { beforeEach, describe, expect, it } from 'vitest'
import { clearSymbolRegistry, createRef, getSymbolInfo, hasSymbol, registerSymbol, resolveImportsForFile } from './refkey.ts'

describe('refkey system', () => {
  beforeEach(() => {
    clearSymbolRegistry()
  })

  describe('createRef', () => {
    it('should create a unique refkey', () => {
      const ref1 = createRef()
      const ref2 = createRef()

      expect(ref1.id).toBeDefined()
      expect(ref2.id).toBeDefined()
      expect(ref1.id).not.toBe(ref2.id)
    })

    it('should create refkeys with sequential IDs', () => {
      clearSymbolRegistry()
      const ref1 = createRef()
      const ref2 = createRef()

      expect(ref1.id).toContain('__kubb_ref_')
      expect(ref2.id).toContain('__kubb_ref_')
    })
  })

  describe('registerSymbol and getSymbolInfo', () => {
    it('should register and retrieve symbol information', () => {
      const refkey = createRef()
      const symbolInfo = {
        name: 'myFunction',
        path: './src/functions.ts',
        refkey,
      }

      registerSymbol(symbolInfo)

      const retrieved = getSymbolInfo(refkey)
      expect(retrieved).toEqual(symbolInfo)
    })

    it('should return undefined for unregistered refkey', () => {
      const refkey = createRef()
      const retrieved = getSymbolInfo(refkey)

      expect(retrieved).toBeUndefined()
    })

    it('should register type-only symbols', () => {
      const refkey = createRef()
      const symbolInfo = {
        name: 'MyType',
        path: './src/types.ts',
        isTypeOnly: true,
        refkey,
      }

      registerSymbol(symbolInfo)

      const retrieved = getSymbolInfo(refkey)
      expect(retrieved?.isTypeOnly).toBe(true)
    })
  })

  describe('hasSymbol', () => {
    it('should return true for registered symbols', () => {
      const refkey = createRef()
      registerSymbol({
        name: 'test',
        path: './test.ts',
        refkey,
      })

      expect(hasSymbol(refkey)).toBe(true)
    })

    it('should return false for unregistered symbols', () => {
      const refkey = createRef()
      expect(hasSymbol(refkey)).toBe(false)
    })
  })

  describe('resolveImportsForFile', () => {
    it('should resolve imports from different files', () => {
      const ref1 = createRef()
      const ref2 = createRef()

      registerSymbol({
        name: 'functionA',
        path: './src/a.ts',
        refkey: ref1,
      })

      registerSymbol({
        name: 'functionB',
        path: './src/b.ts',
        refkey: ref2,
      })

      const refkeysUsed = new Set([ref1, ref2])
      const imports = resolveImportsForFile('./src/c.ts', refkeysUsed)

      expect(imports).toHaveLength(2)
      expect(imports).toContainEqual({
        name: 'functionA',
        path: './src/a.ts',
      })
      expect(imports).toContainEqual({
        name: 'functionB',
        path: './src/b.ts',
      })
    })

    it('should not import from the same file', () => {
      const ref1 = createRef()

      registerSymbol({
        name: 'functionA',
        path: './src/a.ts',
        refkey: ref1,
      })

      const refkeysUsed = new Set([ref1])
      const imports = resolveImportsForFile('./src/a.ts', refkeysUsed)

      expect(imports).toHaveLength(0)
    })

    it('should deduplicate imports from the same file', () => {
      const ref1 = createRef()
      const ref2 = createRef()
      const ref3 = createRef()

      // Register multiple symbols from the same file
      registerSymbol({
        name: 'functionA',
        path: './src/utils.ts',
        refkey: ref1,
      })

      registerSymbol({
        name: 'functionB',
        path: './src/utils.ts',
        refkey: ref2,
      })

      registerSymbol({
        name: 'functionC',
        path: './src/other.ts',
        refkey: ref3,
      })

      const refkeysUsed = new Set([ref1, ref2, ref3])
      const imports = resolveImportsForFile('./src/usage.ts', refkeysUsed)

      expect(imports).toHaveLength(2)

      // Should combine symbols from same file into one import
      const utilsImport = imports.find((imp) => imp.path === './src/utils.ts')
      expect(utilsImport).toBeDefined()
      expect(utilsImport?.name).toEqual(['functionA', 'functionB'])

      // Other file should be separate
      const otherImport = imports.find((imp) => imp.path === './src/other.ts')
      expect(otherImport).toBeDefined()
      expect(otherImport?.name).toBe('functionC')
    })

    it('should handle mixed type-only and value imports from same file', () => {
      const typeRef = createRef()
      const valueRef = createRef()

      // Type-only import
      registerSymbol({
        name: 'MyType',
        path: './src/mixed.ts',
        isTypeOnly: true,
        refkey: typeRef,
      })

      // Value import
      registerSymbol({
        name: 'myFunction',
        path: './src/mixed.ts',
        isTypeOnly: false,
        refkey: valueRef,
      })

      const refkeysUsed = new Set([typeRef, valueRef])
      const imports = resolveImportsForFile('./src/usage.ts', refkeysUsed)

      expect(imports).toHaveLength(1)

      // When mixed, should not be type-only (value import takes precedence)
      const mixedImport = imports[0]
      expect(mixedImport?.path).toBe('./src/mixed.ts')
      expect(mixedImport?.name).toEqual(['MyType', 'myFunction'])
      expect(mixedImport?.isTypeOnly).toBeUndefined()
    })

    it('should preserve isTypeOnly flag', () => {
      const ref1 = createRef()

      registerSymbol({
        name: 'MyType',
        path: './src/types.ts',
        isTypeOnly: true,
        refkey: ref1,
      })

      const refkeysUsed = new Set([ref1])
      const imports = resolveImportsForFile('./src/usage.ts', refkeysUsed)

      expect(imports).toHaveLength(1)
      expect(imports[0]?.isTypeOnly).toBe(true)
    })

    it('should handle empty refkeys set', () => {
      const imports = resolveImportsForFile('./src/test.ts', new Set())
      expect(imports).toHaveLength(0)
    })

    it('should skip unregistered refkeys', () => {
      const ref1 = createRef()
      const ref2 = createRef()

      // Only register ref1
      registerSymbol({
        name: 'functionA',
        path: './src/a.ts',
        refkey: ref1,
      })

      const refkeysUsed = new Set([ref1, ref2])
      const imports = resolveImportsForFile('./src/c.ts', refkeysUsed)

      expect(imports).toHaveLength(1)
      expect(imports[0]?.name).toBe('functionA')
    })
  })

  describe('clearSymbolRegistry', () => {
    it('should clear all registered symbols', () => {
      const ref1 = createRef()
      const ref2 = createRef()

      registerSymbol({
        name: 'functionA',
        path: './src/a.ts',
        refkey: ref1,
      })

      registerSymbol({
        name: 'functionB',
        path: './src/b.ts',
        refkey: ref2,
      })

      expect(hasSymbol(ref1)).toBe(true)
      expect(hasSymbol(ref2)).toBe(true)

      clearSymbolRegistry()

      expect(hasSymbol(ref1)).toBe(false)
      expect(hasSymbol(ref2)).toBe(false)
    })
  })
})
