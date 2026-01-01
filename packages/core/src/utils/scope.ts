/**
 * Scope management system for code generation
 * Inspired by Alloy's Scope context
 *
 * Provides a way to manage symbol visibility and scoping during code generation,
 * similar to how React Context works for component trees.
 */

import type { RefKey } from './refkey.ts'

/**
 * Scope represents a lexical scope in generated code
 */
export type Scope = {
  /**
   * Unique identifier for this scope
   */
  id: string
  /**
   * Parent scope, if any
   */
  parent?: Scope
  /**
   * Symbols defined in this scope
   */
  symbols: Map<string, RefKey>
  /**
   * Metadata associated with this scope
   */
  metadata?: Record<string, unknown>
}

/**
 * Stack of active scopes
 */
let scopeStack: Scope[] = []
let scopeCounter = 0

/**
 * Creates a new scope
 */
export function createScope(metadata?: Record<string, unknown>): Scope {
  const parent = getCurrentScope()
  const scope: Scope = {
    id: `scope_${scopeCounter++}`,
    parent,
    symbols: new Map(),
    metadata,
  }
  return scope
}

/**
 * Gets the current active scope
 */
export function getCurrentScope(): Scope | undefined {
  return scopeStack[scopeStack.length - 1]
}

/**
 * Pushes a scope onto the stack, making it active
 */
export function pushScope(scope: Scope): void {
  scopeStack.push(scope)
}

/**
 * Pops the current scope from the stack
 */
export function popScope(): Scope | undefined {
  return scopeStack.pop()
}

/**
 * Executes a function within a scope
 */
export function withScope<T>(scope: Scope, fn: () => T): T {
  pushScope(scope)
  try {
    return fn()
  } finally {
    popScope()
  }
}

/**
 * Adds a symbol to the current scope
 */
export function defineSymbolInScope(name: string, refkey: RefKey): void {
  const scope = getCurrentScope()
  if (!scope) {
    throw new Error('No active scope. Use createScope() and pushScope() first.')
  }
  scope.symbols.set(name, refkey)
}

/**
 * Looks up a symbol in the current scope and parent scopes
 */
export function lookupSymbol(name: string): RefKey | undefined {
  let scope = getCurrentScope()
  while (scope) {
    const refkey = scope.symbols.get(name)
    if (refkey) {
      return refkey
    }
    scope = scope.parent
  }
  return undefined
}

/**
 * Checks if a symbol exists in the current scope (not parent scopes)
 */
export function hasSymbolInCurrentScope(name: string): boolean {
  const scope = getCurrentScope()
  return scope ? scope.symbols.has(name) : false
}

/**
 * Gets all symbols in the current scope
 */
export function getSymbolsInScope(): Map<string, RefKey> {
  const scope = getCurrentScope()
  return scope ? new Map(scope.symbols) : new Map()
}

/**
 * Clears all scopes (for testing)
 */
export function clearScopes(): void {
  scopeStack = []
  scopeCounter = 0
}

/**
 * Gets the scope stack (for debugging)
 */
export function getScopeStack(): readonly Scope[] {
  return [...scopeStack]
}

/**
 * Helper to create a scoped context for code generation
 *
 * @example
 * ```typescript
 * const classScope = createScopedContext({ type: 'class', name: 'MyClass' })
 * classScope.run(() => {
 *   defineSymbolInScope('method1', method1Ref)
 *   defineSymbolInScope('method2', method2Ref)
 * })
 * ```
 */
export function createScopedContext(metadata?: Record<string, unknown>) {
  const scope = createScope(metadata)

  return {
    scope,
    run<T>(fn: () => T): T {
      return withScope(scope, fn)
    },
    defineSymbol(name: string, refkey: RefKey): void {
      pushScope(scope)
      try {
        defineSymbolInScope(name, refkey)
      } finally {
        popScope()
      }
    },
    lookupSymbol(name: string): RefKey | undefined {
      pushScope(scope)
      try {
        return lookupSymbol(name)
      } finally {
        popScope()
      }
    },
  }
}
