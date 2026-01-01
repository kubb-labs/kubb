import { beforeEach, describe, expect, it } from 'vitest'
import { createRef } from './refkey.ts'
import {
  clearScopes,
  createScope,
  createScopedContext,
  defineSymbolInScope,
  getCurrentScope,
  getScopeStack,
  getSymbolsInScope,
  hasSymbolInCurrentScope,
  lookupSymbol,
  popScope,
  pushScope,
  withScope,
} from './scope.ts'

describe('scope system', () => {
  beforeEach(() => {
    clearScopes()
  })

  describe('createScope', () => {
    it('should create a scope with unique id', () => {
      const scope1 = createScope()
      const scope2 = createScope()

      expect(scope1.id).toBeDefined()
      expect(scope2.id).toBeDefined()
      expect(scope1.id).not.toBe(scope2.id)
    })

    it('should create scope with metadata', () => {
      const scope = createScope({ type: 'class', name: 'MyClass' })

      expect(scope.metadata).toEqual({ type: 'class', name: 'MyClass' })
    })

    it('should set parent to current scope', () => {
      const parent = createScope()
      pushScope(parent)

      const child = createScope()
      expect(child.parent).toBe(parent)

      popScope()
    })
  })

  describe('scope stack management', () => {
    it('should push and pop scopes', () => {
      const scope = createScope()

      pushScope(scope)
      expect(getCurrentScope()).toBe(scope)

      const popped = popScope()
      expect(popped).toBe(scope)
      expect(getCurrentScope()).toBeUndefined()
    })

    it('should maintain stack order', () => {
      const scope1 = createScope()
      const scope2 = createScope()

      pushScope(scope1)
      pushScope(scope2)

      expect(getCurrentScope()).toBe(scope2)

      popScope()
      expect(getCurrentScope()).toBe(scope1)

      popScope()
      expect(getCurrentScope()).toBeUndefined()
    })
  })

  describe('withScope', () => {
    it('should execute function in scope context', () => {
      const scope = createScope()
      let capturedScope: typeof scope | undefined

      withScope(scope, () => {
        capturedScope = getCurrentScope()
      })

      expect(capturedScope).toBe(scope)
      expect(getCurrentScope()).toBeUndefined()
    })

    it('should restore previous scope after execution', () => {
      const scope1 = createScope()
      const scope2 = createScope()

      pushScope(scope1)

      withScope(scope2, () => {
        expect(getCurrentScope()).toBe(scope2)
      })

      expect(getCurrentScope()).toBe(scope1)
    })

    it('should return function result', () => {
      const scope = createScope()
      const result = withScope(scope, () => 42)

      expect(result).toBe(42)
    })

    it('should restore scope even if function throws', () => {
      const scope1 = createScope()
      const scope2 = createScope()

      pushScope(scope1)

      expect(() => {
        withScope(scope2, () => {
          throw new Error('test error')
        })
      }).toThrow('test error')

      expect(getCurrentScope()).toBe(scope1)
    })
  })

  describe('symbol management', () => {
    it('should define symbol in current scope', () => {
      const scope = createScope()
      const refkey = createRef()

      pushScope(scope)
      defineSymbolInScope('mySymbol', refkey)

      expect(scope.symbols.get('mySymbol')).toBe(refkey)
      popScope()
    })

    it('should throw if no active scope', () => {
      const refkey = createRef()

      expect(() => {
        defineSymbolInScope('mySymbol', refkey)
      }).toThrow('No active scope')
    })

    it('should lookup symbol in current scope', () => {
      const scope = createScope()
      const refkey = createRef()

      pushScope(scope)
      defineSymbolInScope('mySymbol', refkey)

      const found = lookupSymbol('mySymbol')
      expect(found).toBe(refkey)

      popScope()
    })

    it('should lookup symbol in parent scopes', () => {
      const parentScope = createScope()
      const parentRef = createRef()

      pushScope(parentScope)
      defineSymbolInScope('parentSymbol', parentRef)

      const childScope = createScope()
      pushScope(childScope)

      const found = lookupSymbol('parentSymbol')
      expect(found).toBe(parentRef)

      popScope()
      popScope()
    })

    it('should return undefined for unknown symbol', () => {
      const scope = createScope()
      pushScope(scope)

      const found = lookupSymbol('unknown')
      expect(found).toBeUndefined()

      popScope()
    })

    it('should check symbol existence in current scope only', () => {
      const parentScope = createScope()
      const parentRef = createRef()

      pushScope(parentScope)
      defineSymbolInScope('parentSymbol', parentRef)

      const childScope = createScope()
      pushScope(childScope)

      expect(hasSymbolInCurrentScope('parentSymbol')).toBe(false)

      popScope()

      expect(hasSymbolInCurrentScope('parentSymbol')).toBe(true)

      popScope()
    })

    it('should get all symbols in current scope', () => {
      const scope = createScope()
      const ref1 = createRef()
      const ref2 = createRef()

      pushScope(scope)
      defineSymbolInScope('symbol1', ref1)
      defineSymbolInScope('symbol2', ref2)

      const symbols = getSymbolsInScope()
      expect(symbols.size).toBe(2)
      expect(symbols.get('symbol1')).toBe(ref1)
      expect(symbols.get('symbol2')).toBe(ref2)

      popScope()
    })
  })

  describe('createScopedContext', () => {
    it('should create a scoped context', () => {
      const context = createScopedContext({ type: 'class' })

      expect(context.scope).toBeDefined()
      expect(context.scope.metadata).toEqual({ type: 'class' })
    })

    it('should run function in context scope', () => {
      const context = createScopedContext()
      const refkey = createRef()

      context.run(() => {
        defineSymbolInScope('test', refkey)
      })

      expect(context.scope.symbols.get('test')).toBe(refkey)
    })

    it('should define symbols in context', () => {
      const context = createScopedContext()
      const refkey = createRef()

      context.defineSymbol('test', refkey)

      expect(context.scope.symbols.get('test')).toBe(refkey)
    })

    it('should lookup symbols in context', () => {
      const context = createScopedContext()
      const refkey = createRef()

      context.defineSymbol('test', refkey)

      const found = context.lookupSymbol('test')
      expect(found).toBe(refkey)
    })
  })

  describe('getScopeStack', () => {
    it('should return current scope stack', () => {
      const scope1 = createScope()
      const scope2 = createScope()

      pushScope(scope1)
      pushScope(scope2)

      const stack = getScopeStack()
      expect(stack).toHaveLength(2)
      expect(stack[0]).toBe(scope1)
      expect(stack[1]).toBe(scope2)

      popScope()
      popScope()
    })
  })

  describe('clearScopes', () => {
    it('should clear all scopes', () => {
      const scope1 = createScope()
      const scope2 = createScope()

      pushScope(scope1)
      pushScope(scope2)

      expect(getScopeStack()).toHaveLength(2)

      clearScopes()

      expect(getScopeStack()).toHaveLength(0)
      expect(getCurrentScope()).toBeUndefined()
    })
  })
})
