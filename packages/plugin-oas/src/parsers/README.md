# Parser Architecture

This directory contains base types and utilities for creating extensible validation library parsers in Kubb.

## Overview

Kubb's parser architecture provides a consistent way to map OpenAPI schemas to validation library syntax (Zod, Valibot, etc.). The architecture is designed to be:

- **Extensible**: Easy to add support for new validation libraries
- **Reusable**: Common functionality shared across parser implementations
- **Type-safe**: Strong TypeScript types for parser options and outputs
- **Consistent**: Unified approach to handling schema keywords

## Core Concepts

### createParser (Recommended)

The easiest way to create a new parser is using the `createParser` helper. It handles the common recursive parsing logic while allowing customization:

```typescript
import { createParser } from '@kubb/plugin-oas'

const valibotKeywordMapper = {
  string: () => 'v.string()',
  number: () => 'v.number()',
  array: (items) => `v.array(${items.join('')})`,
  object: (context, options, parse) => {
    // Handle object properties recursively
    return 'v.object({ ... })'
  },
  // ... other keywords
}

export const parse = createParser({
  keywordMapper: valibotKeywordMapper,
  customHandlers: {
    union: (context, options, parse) => {
      // Custom union handling
      const items = context.current.args
        .map(it => parse({ ...context, current: it }, options))
        .filter(Boolean)
      return `v.union([${items.join(', ')}])`
    }
  }
})
```

### SchemaMapper

Every validation library parser implements a `SchemaMapper` that maps OpenAPI schema keywords to validation syntax:

```typescript
import type { SchemaMapper } from '@kubb/plugin-oas'

const zodKeywordMapper = {
  string: () => 'z.string()',
  number: (min?: number, max?: number) => {
    // Generate validation code with constraints
    return 'z.number()...'
  },
  // ... other keywords
} satisfies SchemaMapper<string>
```

### Parser Function (Manual Approach)

For full control, you can manually create a parser function that processes schema trees:

```typescript
import type { SchemaTree } from '@kubb/plugin-oas'

export function parse(
  { schema, parent, current, siblings, name }: SchemaTree,
  options: ParserOptions
): string | undefined {
  // Map current schema keyword to validation code
  // Handle special cases (unions, arrays, objects, etc.)
  // Return generated validation syntax
}
```

**Note**: Using `createParser` is recommended as it handles common patterns automatically.

## Base Types

### BaseParserOptions

All parsers should support these basic options:

```typescript
type BaseParserOptions = {
  mapper?: Record<string, string>  // Override specific properties
  canOverride?: boolean            // Allow overriding (for faker)
}
```

### CoercionOptions

For parsers that support type coercion:

```typescript
type CoercionOptions = {
  coercion?: boolean | {
    dates?: boolean
    strings?: boolean
    numbers?: boolean
  }
}
```

Helper function:

```typescript
import { shouldCoerce } from '@kubb/plugin-oas'

const coerceNumbers = shouldCoerce(options.coercion, 'numbers')
```

### Mini Mode Support

For functional API style validation libraries (like Zod Mini):

```typescript
import {
  extractMiniModifiers,
  filterMiniModifiers,
  miniModifierKeywords
} from '@kubb/plugin-oas'

// Separate modifiers from base schema
const baseSchemas = filterMiniModifiers(schemas)
const modifiers = extractMiniModifiers(schemas)

// Parse base schema
const output = parseBaseSchema(baseSchemas)

// Wrap with functional modifiers
const finalOutput = wrapWithModifiers(output, modifiers)
```

## Creating a New Parser

Follow these steps to add support for a new validation library:

### 1. Create the Parser File (Using createParser)

Create `packages/plugin-{library}/src/parser.ts` using the `createParser` helper:

```typescript
import type { SchemaMapper } from '@kubb/plugin-oas'
import { createParser, shouldCoerce, type BaseParserOptions } from '@kubb/plugin-oas'

// Define keyword mapper
const libraryKeywordMapper = {
  any: () => 'v.any()',
  string: () => 'v.string()',
  number: () => 'v.number()',
  array: (items) => `v.array(${items.join('')})`,
  union: (items) => `v.union([${items.join(', ')}])`,
  object: (context, options, parse) => {
    // Handle object properties using parse recursively
    const properties = Object.entries(context.current.args.properties || {})
      .map(([key, schemas]) => {
        const value = schemas
          .map(s => parse({ ...context, current: s }, options))
          .filter(Boolean)
          .join('')
        return `${key}: ${value}`
      })
      .join(', ')
    return `v.object({ ${properties} })`
  },
  // ... implement all required SchemaMapper keywords
} satisfies SchemaMapper<string>

// Define parser options
type ParserOptions = BaseParserOptions & {
  coercion?: boolean | { dates?: boolean; strings?: boolean; numbers?: boolean }
  version?: string
}

// Create parse function using createParser
export const parse = createParser<string, ParserOptions>({
  keywordMapper: libraryKeywordMapper,
  
  // Optional: Add custom handlers for specific keywords
  customHandlers: {
    // Override default handling for specific cases
    string: (context, options) => {
      const coerce = shouldCoerce(options.coercion, 'strings')
      return coerce ? 'v.coerce.string()' : 'v.string()'
    }
  },
  
  // Optional: Add pre/post processing
  beforeParse: (context, options) => {
    // Normalize or validate input
    return context
  },
  
  afterParse: (output, context, options) => {
    // Transform output if needed
    return output
  }
})
```

### 1b. Alternative: Manual Parser Implementation

For full control, you can manually implement the parse function:

```typescript
import type { SchemaMapper, SchemaTree } from '@kubb/plugin-oas'
import { isKeyword, schemaKeywords, shouldCoerce } from '@kubb/plugin-oas'

// Define keyword mapper
const libraryKeywordMapper = {
  any: () => 'v.any()',
  string: (min?: number, max?: number) => {
    // Generate validation syntax
    return 'v.string()...'
  },
  // ... implement all SchemaMapper keywords
} satisfies SchemaMapper<string>

// Define parser options
type ParserOptions = {
  mapper?: Record<string, string>
  coercion?: boolean | { dates?: boolean; strings?: boolean; numbers?: boolean }
  version?: string
}

// Implement parse function manually
export function parse(
  { schema, parent, current, siblings, name }: SchemaTree,
  options: ParserOptions
): string | undefined {
  const value = libraryKeywordMapper[current.keyword]
  
  if (!value) {
    return undefined
  }

  // Handle special keywords (union, array, object, etc.)
  if (isKeyword(current, schemaKeywords.union)) {
    // Parse union members recursively
  }

  if (isKeyword(current, schemaKeywords.object)) {
    // Parse object properties recursively
  }

  // ... handle other keywords

  return value()
}
```

### 2. Support Mini Mode (Optional)

If the library has a functional API variant:

```typescript
import {
  extractMiniModifiers,
  filterMiniModifiers,
  type MiniModifiers
} from '@kubb/plugin-oas'

// In your keyword mapper, add mini mode support
const libraryKeywordMapper = {
  string: (min?: number, max?: number, mini?: boolean) => {
    if (mini) {
      // Return functional style validation
      return 'v.string().check(...)'
    }
    // Return chainable style validation
    return 'v.string().min(...).max(...)'
  }
}

// Add wrapper function for mini modifiers
export function wrapWithMiniModifiers(
  output: string,
  modifiers: MiniModifiers
): string {
  let result = output

  if (modifiers.defaultValue !== undefined) {
    result = libraryKeywordMapper.default(modifiers.defaultValue, result, true)
  }

  if (modifiers.hasOptional) {
    result = libraryKeywordMapper.optional(result)
  }

  // ... apply other modifiers

  return result
}
```

### 3. Create Component

Create `packages/plugin-{library}/src/components/{Library}.tsx`:

```typescript
import { isKeyword, SchemaGenerator, schemaKeywords } from '@kubb/plugin-oas'
import { Const, File } from '@kubb/react-fabric'
import * as parser from '../parser.ts'

export function Library({ name, tree, schema, options }) {
  // Filter schemas
  const schemas = parser.sort(tree)
  
  // For mini mode, separate base schema from modifiers
  const baseSchemas = options.mini 
    ? parser.filterMiniModifiers(schemas) 
    : schemas

  // Parse base schema
  const output = baseSchemas
    .map(schema => parser.parse({ schema, ... }, options))
    .filter(Boolean)
    .join('')

  // Apply mini modifiers if needed
  const finalOutput = options.mini
    ? parser.wrapWithMiniModifiers(output, parser.extractMiniModifiers(schemas))
    : output

  return (
    <File.Source name={name} isExportable isIndexable>
      <Const export name={name}>
        {finalOutput}
      </Const>
    </File.Source>
  )
}
```

### 4. Create Generator

Create `packages/plugin-{library}/src/generators/{library}Generator.tsx`:

```typescript
import { createReactGenerator } from '@kubb/plugin-oas/generators'
import { Library } from '../components'

export const libraryGenerator = createReactGenerator({
  name: 'library',
  Operation({ operation, plugin, generator }) {
    // Get schemas from operation
    const schemas = getSchemas(operation)
    
    // Generate validation code using component
    return (
      <File ...>
        <Library
          name="PetSchema"
          tree={tree}
          schema={schemaObject}
          options={plugin.options}
        />
      </File>
    )
  }
})
```

## Examples

### Zod Parser

See `packages/plugin-zod/src/parser.ts` for a complete implementation with:
- Full SchemaMapper implementation
- Support for Zod v3 and v4
- Mini mode support (Zod Mini)
- Coercion options
- Type inference

### TypeScript Parser

See `packages/plugin-ts/src/parser.ts` for a parser that generates TypeScript types instead of validation code.

### Faker Parser

See `packages/plugin-faker/src/parser.ts` for a parser that generates mock data using Faker.js.

## Best Practices

1. **Use Shared Utilities**: Import helpers from `@kubb/plugin-oas` instead of reimplementing them
2. **Handle All Keywords**: Implement all required SchemaMapper keywords (return `undefined` for unsupported ones)
3. **Recursive Parsing**: Use recursion for complex types (unions, arrays, objects)
4. **Type Safety**: Use TypeScript types from `@kubb/plugin-oas` for consistency
5. **Testing**: Add comprehensive tests for your parser (see `parser.test.ts` examples)
6. **Documentation**: Document parser-specific options and behavior
7. **Backwards Compatibility**: Re-export utilities for backwards compatibility if moving code

## Testing

Create `packages/plugin-{library}/src/parser.test.ts`:

```typescript
import { describe, expect, test } from 'vitest'
import { SchemaGenerator, schemaKeywords } from '@kubb/plugin-oas'
import { parse } from './parser.ts'

describe('library parser', () => {
  test('string schema', () => {
    const result = parse({
      schema: {},
      current: { keyword: schemaKeywords.string },
      siblings: [],
    }, {})
    
    expect(result).toBe('v.string()')
  })

  // Add more tests...
})
```

## Resources

- [SchemaMapper API](../SchemaMapper.ts)
- [SchemaGenerator API](../SchemaGenerator.ts)
- [Zod Plugin Example](../../plugin-zod/)
- [TypeScript Plugin Example](../../plugin-ts/)
