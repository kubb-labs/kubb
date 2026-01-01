# Scope Context System

The Scope Context system is inspired by Alloy's scope management and provides React-like context capabilities for managing symbol scoping and visibility during code generation.

## What is a Scope?

A **scope** represents a lexical scope in your generated code (like a function, class, or block scope). It maintains a symbol table and can have parent-child relationships, allowing for proper symbol resolution and shadowing.

## Key Concepts

### Scope Hierarchy
- Scopes can be nested, forming a parent-child hierarchy
- Symbol lookup walks up the scope chain (current → parent → grandparent, etc.)
- Symbols in child scopes can shadow parent scope symbols

### Scope Stack
- The system maintains an active scope stack
- Operations work on the current (top) scope
- Scopes can be pushed/popped or used temporarily with `withScope`

## Basic Usage

### Creating and Using Scopes

```typescript
import { createScope, pushScope, popScope, defineSymbolInScope } from '@kubb/core/utils'

// Create a scope
const classScope = createScope({ type: 'class', name: 'MyClass' })

// Make it active
pushScope(classScope)

// Define symbols in the scope
const methodRef = createRef()
defineSymbolInScope('myMethod', methodRef)

// Clean up
popScope()
```

### Temporary Scope Usage

```typescript
import { createScope, withScope, defineSymbolInScope } from '@kubb/core/utils'

const scope = createScope()

// Execute code within a scope
withScope(scope, () => {
  defineSymbolInScope('tempVar', createRef())
  // Scope is automatically restored after this block
})

// Scope is no longer active here
```

### Scoped Context Helper

```typescript
import { createScopedContext } from '@kubb/core/utils'

// Create a scoped context with metadata
const classContext = createScopedContext({
  type: 'class',
  name: 'UserController'
})

// Run code in the context
classContext.run(() => {
  const getUserRef = createRef()
  defineSymbolInScope('getUser', getUserRef)
  
  const updateUserRef = createRef()
  defineSymbolInScope('updateUser', updateUserRef)
})

// Define symbols directly
classContext.defineSymbol('deleteUser', createRef())

// Lookup symbols
const getUserRef = classContext.lookupSymbol('getUser')
```

## Advanced Usage

### Nested Scopes

```typescript
import { createScope, withScope, defineSymbolInScope, lookupSymbol } from '@kubb/core/utils'

const classScope = createScope({ type: 'class' })
const methodScope = createScope({ type: 'method' })

withScope(classScope, () => {
  // Define in class scope
  defineSymbolInScope('classVar', createRef())
  
  withScope(methodScope, () => {
    // Define in method scope
    defineSymbolInScope('localVar', createRef())
    
    // Can lookup both
    const classVar = lookupSymbol('classVar') // Found in parent
    const localVar = lookupSymbol('localVar') // Found in current
  })
})
```

### Symbol Shadowing

```typescript
withScope(createScope(), () => {
  const outerRef = createRef()
  defineSymbolInScope('x', outerRef)
  
  withScope(createScope(), () => {
    const innerRef = createRef()
    defineSymbolInScope('x', innerRef) // Shadows outer 'x'
    
    const found = lookupSymbol('x')
    // Returns innerRef (from current scope)
  })
  
  const found = lookupSymbol('x')
  // Returns outerRef (inner scope is gone)
})
```

### Scope-Aware Code Generation

```typescript
import { createScopedContext, registerSymbol } from '@kubb/core/utils'

function generateClass(className: string, methods: string[]) {
  const classContext = createScopedContext({
    type: 'class',
    name: className
  })
  
  return classContext.run(() => {
    // Generate methods in class scope
    methods.forEach(methodName => {
      const methodRef = createRef()
      
      // Register both in scope and global registry
      classContext.defineSymbol(methodName, methodRef)
      registerSymbol({
        name: methodName,
        path: `./classes/${className}.ts`,
        refkey: methodRef
      })
    })
    
    // Generate class code...
  })
}
```

## Integration with RefKey System

The Scope system works seamlessly with the RefKey system:

```typescript
import { createScopedContext, createRef, registerSymbol } from '@kubb/core/utils'

const moduleContext = createScopedContext({ type: 'module' })

moduleContext.run(() => {
  // Create and register a symbol
  const utilRef = createRef()
  
  // Add to both scope and global registry
  defineSymbolInScope('formatDate', utilRef)
  registerSymbol({
    name: 'formatDate',
    path: './utils.ts',
    refkey: utilRef
  })
  
  // Later, lookup within scope
  const found = lookupSymbol('formatDate')
  // Or use global registry with getSymbolInfo(utilRef)
})
```

## API Reference

### Scope Management

#### `createScope(metadata?: Record<string, unknown>): Scope`
Creates a new scope with optional metadata.

#### `getCurrentScope(): Scope | undefined`
Gets the currently active scope.

#### `pushScope(scope: Scope): void`
Pushes a scope onto the stack, making it active.

#### `popScope(): Scope | undefined`
Pops the current scope from the stack.

#### `withScope<T>(scope: Scope, fn: () => T): T`
Executes a function within a scope context, automatically restoring the previous scope.

### Symbol Operations

#### `defineSymbolInScope(name: string, refkey: RefKey): void`
Adds a symbol to the current scope. Throws if no scope is active.

#### `lookupSymbol(name: string): RefKey | undefined`
Looks up a symbol in the current scope and parent scopes.

#### `hasSymbolInCurrentScope(name: string): boolean`
Checks if a symbol exists in the current scope only (not parent scopes).

#### `getSymbolsInScope(): Map<string, RefKey>`
Gets all symbols defined in the current scope.

### Utilities

#### `getScopeStack(): readonly Scope[]`
Gets the current scope stack (for debugging).

#### `clearScopes(): void`
Clears all scopes (primarily for testing).

#### `createScopedContext(metadata?: Record<string, unknown>)`
Creates a helper object with convenient methods for scope management:
- `scope: Scope` - The underlying scope
- `run<T>(fn: () => T): T` - Execute code in this scope
- `defineSymbol(name, refkey)` - Define a symbol in this scope
- `lookupSymbol(name)` - Lookup a symbol in this scope

## Use Cases

### 1. Class Member Management

```typescript
const classContext = createScopedContext({ type: 'class', name: 'UserService' })

classContext.run(() => {
  // Define methods
  ['getUser', 'createUser', 'updateUser', 'deleteUser'].forEach(method => {
    classContext.defineSymbol(method, createRef())
  })
  
  // Check if method exists before adding
  if (!classContext.lookupSymbol('patchUser')) {
    classContext.defineSymbol('patchUser', createRef())
  }
})
```

### 2. Function Local Variables

```typescript
const functionContext = createScopedContext({ type: 'function' })

functionContext.run(() => {
  // Define parameters
  functionContext.defineSymbol('userId', createRef())
  functionContext.defineSymbol('options', createRef())
  
  // Define local variables
  functionContext.defineSymbol('result', createRef())
  functionContext.defineSymbol('error', createRef())
})
```

### 3. Module-Level Exports

```typescript
const moduleContext = createScopedContext({ type: 'module', path: './api.ts' })

moduleContext.run(() => {
  // Track all exports in this module
  const exports = ['fetchData', 'postData', 'updateData']
  
  exports.forEach(exportName => {
    const ref = createRef()
    moduleContext.defineSymbol(exportName, ref)
    registerSymbol({ name: exportName, path: './api.ts', refkey: ref })
  })
})
```

## Best Practices

1. **Always clean up scopes**: Use `withScope` or try/finally to ensure scopes are properly restored
2. **Use scoped contexts for convenience**: `createScopedContext` provides a cleaner API
3. **Add metadata**: Include type, name, or other info in scope metadata for debugging
4. **Combine with RefKey**: Use both scope management and global symbol registry together
5. **Don't rely on global state**: Pass scope references explicitly when needed

## Comparison with Alloy

| Feature | Alloy | Kubb Scope System |
|---------|-------|-------------------|
| Scope hierarchy | ✅ Yes | ✅ Yes |
| Symbol lookup | ✅ Yes | ✅ Yes |
| Metadata support | ✅ Yes | ✅ Yes |
| React-like API | ✅ useScope hook | ✅ Scoped context |
| Automatic cleanup | ✅ Component lifecycle | ✅ withScope helper |
| Integration | Built into renderer | Utility layer |

## Future Enhancements

Potential improvements:
- React hooks integration for use in components
- Scope visualization and debugging tools
- Automatic scope inference from component tree
- Scope-aware refactoring helpers
