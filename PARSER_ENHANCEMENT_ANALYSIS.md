# Parser Enhancement Analysis

## Problem Statement
"https://github.com/kubb-labs/kubb/discussions/1980 see how we can update the parsers to support this"

## Access Issues
**Unable to access discussion #1980** through any available means:
- Browser navigation: Blocked
- GitHub API search: No results
- Web search: No results
- Git history: No references
- Codebase files: No references

## Research Findings

### Current Parser Architecture

#### 1. Core Components
- **createParser** (`packages/plugin-oas/src/createParser.ts`): Factory function for building parsers
  - Takes `SchemaMapper` and custom `handlers`
  - Provides keyword-based schema to output conversion
  - Supports recursive parsing via `this.parse` context

#### 2. Existing Parsers
- **Zod Parser** (`packages/plugin-zod/src/parser.ts`)
  - Has `zodKeywordMapper` object
  - TODO comment: "add zodKeywordMapper as function that returns 3 versions: v3, v4 and v4 mini"
  - Supports v3, v4, and mini mode
  
- **Faker Parser** (`packages/plugin-faker/src/parser.ts`)
  - Has `fakerKeywordMapper` object
  - Uses `mapper` option for custom property overrides

- **TypeScript Parser** (`packages/plugin-ts/src/parser.ts`)
  - Has `typeKeywordMapper` object
  - Generates TypeScript AST nodes

#### 3. Current `mapper` Option
**Location**: Defined in `SchemaGeneratorOptions` but used in individual plugins

**Usage Pattern** (from Faker & Zod):
```typescript
// In plugin options
mapper: {
  propertyName: 'custom.code.here'
}

// In parser (e.g., faker parser line 296-297)
if (options.mapper?.[mappedName]) {
  return `"${name}": ${options.mapper?.[mappedName]}`
}
```

**Limitation**: Only allows string-based property overrides, cannot access schema metadata or custom OpenAPI attributes.

### Custom OpenAPI Attributes

#### Current Support
**x-enumNames & x-enum-varnames** are supported in `SchemaGenerator.ts` (lines 799-819):
```typescript
const extensionEnums = ['x-enumNames', 'x-enum-varnames']
  .filter((extensionKey) => extensionKey in schemaObject)
  .map((extensionKey) => {
    return [{
      keyword: schemaKeywords.enum,
      args: {
        items: schemaObject[extensionKey].map((name, index) => ({
          name,
          value: schemaObject.enum[index],
          format: ...
        }))
      }
    }]
  })
```

#### Related Discussion #1804
Requests support for custom attributes like `x-error-message`:
```yaml
email:
  type: string
  format: email
  x-error-message: "Invalid email format"
```

Desired output:
```typescript
z.string().email({ message: "Invalid email format" })
```

### Potential Enhancement Approaches

#### Option 1: Function-Based Keyword Mappers
Refactor keyword mappers from objects to functions that return configured mappers:

```typescript
// Current (object)
const zodKeywordMapper = {
  string: (coercion, min, max, mini) => { ... }
}

// Enhanced (function)
function createZodKeywordMapper(config: {
  version: '3' | '4'
  mini?: boolean
  customAttributes?: Record<string, (value: any) => string>
}) {
  return {
    string: (coercion, min, max) => {
      // Use config to customize output
    }
  }
}
```

**Benefits**:
- Addresses TODO in zod parser
- Makes versioning cleaner
- Allows per-parser configuration

#### Option 2: Custom Attribute Handlers
Add support for reading and processing custom OpenAPI attributes:

```typescript
// New schema keyword for custom attributes
type CustomAttributeSchema = {
  keyword: 'customAttribute'
  args: {
    name: string  // e.g., 'x-error-message'
    value: any
  }
}

// In parsers
handlers: {
  string(tree, options) {
    const errorMsg = findCustomAttribute(tree.siblings, 'x-error-message')
    if (errorMsg) {
      return `z.string().email({ message: ${errorMsg} })`
    }
    // ... default logic
  }
}
```

**Benefits**:
- Enables discussion #1804 use case
- Extensible to any x-* attribute
- Backward compatible

#### Option 3: Enhanced Mapper with Schema Access
Upgrade `mapper` option to accept functions with schema access:

```typescript
mapper: {
  email: (schema, defaultOutput) => {
    const errorMsg = schema['x-error-message']
    if (errorMsg) {
      return `${defaultOutput}.email({ message: "${errorMsg}" })`
    }
    return defaultOutput
  }
}
```

**Benefits**:
- Minimal API change
- Powerful customization
- Addresses both use cases

#### Option 4: Parser Plugin System
Create a plugin system for parsers:

```typescript
createParser({
  mapper: zodKeywordMapper,
  handlers: { ... },
  plugins: [
    customAttributePlugin({
      'x-error-message': (value, context) => {
        return `.with({ message: "${value}" })`
      }
    })
  ]
})
```

**Benefits**:
- Most flexible
- Clean separation of concerns
- Reusable across parsers

## Recommended Actions

Without access to discussion #1980, I recommend:

1. **Immediate**: Maintainer review to clarify requirements
2. **Short-term**: Implement Option 3 (Enhanced Mapper) as it's backward compatible and addresses known requests
3. **Long-term**: Consider Option 1 (Function-Based Mappers) to address the TODO and improve maintainability

## Implementation Checklist (Pending Requirements)

- [ ] Clarify exact requirements from discussion #1980
- [ ] Choose enhancement approach (Options 1-4 or combination)
- [ ] Update `SchemaMapper` types if needed
- [ ] Modify `createParser` to support new features
- [ ] Update all parsers (zod, faker, ts) consistently
- [ ] Add support for reading custom OpenAPI attributes
- [ ] Create comprehensive tests
- [ ] Update documentation
- [ ] Add examples
- [ ] Create changeset
- [ ] Update changelog

## Files to Modify

### Core
- `packages/plugin-oas/src/createParser.ts` - Parser factory
- `packages/plugin-oas/src/SchemaMapper.ts` - Type definitions
- `packages/plugin-oas/src/SchemaGenerator.ts` - Custom attribute reading

### Parsers
- `packages/plugin-zod/src/parser.ts` - Zod parser enhancements
- `packages/plugin-faker/src/parser.ts` - Faker parser enhancements  
- `packages/plugin-ts/src/parser.ts` - TypeScript parser enhancements

### Tests
- `packages/plugin-zod/src/parser.test.ts`
- `packages/plugin-faker/src/parser.test.ts`
- `packages/plugin-ts/src/parser.test.ts`

### Documentation
- `docs/plugins/plugin-zod/index.md`
- `docs/plugins/plugin-faker/index.md`
- `docs/plugins/plugin-ts/index.md`
- Add examples showing custom attribute usage

## Next Steps

**AWAITING**: Access to or clarification of discussion #1980 requirements before proceeding with implementation.
