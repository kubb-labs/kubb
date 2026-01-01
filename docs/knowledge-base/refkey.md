# RefKey System - Automatic Import Management

The RefKey system is inspired by the [Alloy framework](https://github.com/alloy-framework/alloy) and provides automatic import management for generated code in Kubb.

## What is a RefKey?

A **refkey** (reference key) is a unique identifier for a symbol (variable, function, type, etc.) in your generated code. When you use a refkey to reference a symbol in another file, Kubb automatically generates the necessary import statement.

## Key Benefits

- **No manual import management**: Imports are generated automatically when you reference symbols
- **Safer refactoring**: References update automatically if you move symbols between files
- **Type-safe references**: RefKeys can be typed to match their symbol type
- **Cross-file symbol references**: Easily reference symbols across different generated files

## Basic Usage

### Creating a RefKey

```typescript
import { createRef } from '@kubb/core/utils'

// Create a refkey for a symbol
const myFunctionRef = createRef()

// Create a typed refkey
const myTypeRef = createRef<MyType>()
```

### Registering a Symbol

When you export a symbol, register it with a refkey:

```typescript
import { registerSymbol } from '@kubb/core/utils'

// Register the symbol with its location
registerSymbol({
  name: 'myFunction',
  path: './src/functions.ts',
  refkey: myFunctionRef,
})

// Register a type-only export
registerSymbol({
  name: 'MyType',
  path: './src/types.ts',
  isTypeOnly: true,
  refkey: myTypeRef,
})
```

### Using RefKeys in Components

In your React components, you can use refkeys to reference symbols. The imports will be automatically generated:

```tsx
import { createRef, registerSymbol } from '@kubb/core/utils'
import { File, Function, Const } from '@kubb/react-fabric'

// Create refkeys
const utilsRef = createRef()
const typeRef = createRef()

// File 1: Define and register a utility function
export function UtilsFile() {
  // Register the symbol when it's defined
  registerSymbol({
    name: 'formatDate',
    path: './src/utils.ts',
    refkey: utilsRef,
  })

  return (
    <File baseName="utils.ts" path="./src/utils.ts">
      <File.Source name="formatDate" isExportable isIndexable>
        <Function export name="formatDate" params={[{ name: 'date', type: 'Date' }]} returnType="string">
          {`return date.toISOString()`}
        </Function>
      </File.Source>
    </File>
  )
}

// File 2: Use the utility - import will be auto-generated
export function UserFile() {
  // When this component is rendered, Kubb will detect the refkey usage
  // and automatically add: import { formatDate } from './utils'
  
  return (
    <File baseName="user.ts" path="./src/user.ts">
      <File.Source name="getUserInfo">
        <Function export name="getUserInfo">
          {`const date = formatDate(new Date())`}
        </Function>
      </File.Source>
    </File>
  )
}
```

## Advanced Usage

### Resolving Imports for a File

You can manually resolve what imports are needed for a file:

```typescript
import { resolveImportsForFile, createRef } from '@kubb/core/utils'

const ref1 = createRef()
const ref2 = createRef()

// ... register symbols ...

// Get all imports needed for a specific file
const refkeysUsed = new Set([ref1, ref2])
const imports = resolveImportsForFile('./src/myFile.ts', refkeysUsed)

// imports will be:
// [
//   { name: 'symbol1', path: './src/a.ts' },
//   { name: 'symbol2', path: './src/b.ts', isTypeOnly: true }
// ]
```

### Type-Only Exports

For TypeScript type exports, use the `isTypeOnly` flag:

```typescript
registerSymbol({
  name: 'UserType',
  path: './src/types.ts',
  isTypeOnly: true, // This will generate: import type { UserType } from './types'
  refkey: userTypeRef,
})
```

### Namespace Exports

For namespace imports:

```typescript
registerSymbol({
  name: 'Utils',
  path: './src/utils.ts',
  isNameSpace: true, // This will generate: import * as Utils from './utils'
  refkey: utilsRef,
})
```

## Integration with Fabric

The RefKey system integrates seamlessly with Kubb's Fabric and React-Fabric:

```tsx
import { createRef, registerSymbol } from '@kubb/core/utils'
import { File, Type, Const } from '@kubb/react-fabric'

const petTypeRef = createRef()
const petDataRef = createRef()

// Define types
export function TypesComponent() {
  registerSymbol({
    name: 'Pet',
    path: './gen/types.ts',
    isTypeOnly: true,
    refkey: petTypeRef,
  })

  return (
    <File baseName="types.ts" path="./gen/types.ts">
      <File.Source>
        <Type export name="Pet">
          {`{ id: number; name: string; status: string }`}
        </Type>
      </File.Source>
    </File>
  )
}

// Use types - imports auto-generated
export function DataComponent() {
  registerSymbol({
    name: 'defaultPet',
    path: './gen/data.ts',
    refkey: petDataRef,
  })

  return (
    <File baseName="data.ts" path="./gen/data.ts">
      <File.Source>
        {/* import type { Pet } from './types' will be auto-generated */}
        <Const export name="defaultPet" type="Pet">
          {`{ id: 1, name: 'Fluffy', status: 'available' }`}
        </Const>
      </File.Source>
    </File>
  )
}
```

## Comparison with Manual Imports

### Before (Manual Imports)

```tsx
<File baseName="api.ts" path="./gen/api.ts">
  <File.Import name={['request']} path="./request" />
  <File.Import name={['Todo']} path="./types" isTypeOnly />
  <File.Source>
    <Function export name="getTodos">
      {`return request<Todo[]>('/api/todos')`}
    </Function>
  </File.Source>
</File>
```

### After (With RefKeys)

```tsx
// Just use the symbols - imports are auto-generated
<File baseName="api.ts" path="./gen/api.ts">
  <File.Source>
    <Function export name="getTodos">
      {`return request<Todo[]>('/api/todos')`}
    </Function>
  </File.Source>
</File>
```

The imports are automatically generated based on which refkeys are detected in the code.

## API Reference

### `createRef<T>()`

Creates a unique reference key for a symbol.

**Type Parameters:**
- `T` - Optional type of the symbol being referenced

**Returns:** `RefKey<T>`

### `registerSymbol(info: SymbolInfo)`

Registers a symbol with its metadata.

**Parameters:**
- `info.name: string` - The symbol name
- `info.path: string` - The file path where the symbol is declared
- `info.refkey: RefKey` - The refkey for this symbol
- `info.isTypeOnly?: boolean` - Whether this is a type-only export
- `info.isNameSpace?: boolean` - Whether this is a namespace import

### `getSymbolInfo(refkey: RefKey)`

Retrieves registered symbol information.

**Returns:** `SymbolInfo | undefined`

### `hasSymbol(refkey: RefKey)`

Checks if a refkey has been registered.

**Returns:** `boolean`

### `resolveImportsForFile(currentFilePath: string, refkeysUsed: Set<RefKey>)`

Resolves all imports needed for a file based on refkeys used.

**Returns:** Array of import specifications

### `clearSymbolRegistry()`

Clears all registered symbols (mainly for testing).

## Best Practices

1. **Create refkeys at module level**: Define refkeys outside of component functions for better reusability
2. **Register symbols when defined**: Call `registerSymbol` immediately when defining the symbol
3. **Use typed refkeys**: Add type parameters to `createRef` for better type safety
4. **One refkey per symbol**: Don't reuse refkeys for different symbols
5. **Clean registry in tests**: Use `clearSymbolRegistry()` in test setup to avoid cross-test pollution

## Future Enhancements

Potential future improvements to the RefKey system:

- Automatic refkey tracking during component render
- Built-in support in `<File.Source>` component
- RefKey debugging tools
- Import optimization and deduplication
- Support for re-exports and barrel files
