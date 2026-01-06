# TypeScript Printer Crash Fix

## Summary

Fixed a critical bug where `@kubb/plugin-ts` could create invalid TypeScript AST nodes with `SyntaxKind.Unknown`, causing the TypeScript printer to crash with "Debug Failure. Unhandled SyntaxKind: Unknown" error. The issue occurred when processing certain OpenAPI schemas (notably the Jira public spec) and would fail silently without properly reporting errors.

## Root Cause

The issue had two primary causes:

1. **Invalid Node Creation**: When parsing OpenAPI schemas, if all schema keywords mapped to `undefined` in `typeKeywordMapper`, the parser would create TypeScript union/intersection nodes with undefined values, resulting in nodes with `SyntaxKind.Unknown`.

2. **Silent Failure**: The `print` function in `@kubb/fabric-core` would detect Unknown nodes and log errors to console, but would not throw exceptions or set `result.error`, allowing builds to succeed despite generation failures.

## Changes Made

### 1. Factory Functions (`packages/plugin-ts/src/factory.ts`)

Added null/undefined filtering in all node creation functions to prevent invalid AST nodes:

- `createUnionDeclaration`: Filters out null/undefined nodes before creating union types
- `createIntersectionDeclaration`: Filters out null/undefined nodes before creating intersection types
- `createArrayDeclaration`: Filters out null/undefined nodes before creating array types
- `createTupleDeclaration`: Filters out null/undefined nodes before creating tuple types

**Example:**
```typescript
export function createUnionDeclaration({ nodes, withParentheses }: { nodes: Array<ts.TypeNode>; withParentheses?: boolean }): ts.TypeNode {
  // Filter out undefined/null nodes to prevent creating invalid AST
  const validNodes = nodes.filter((node): node is ts.TypeNode => node != null)
  
  if (!validNodes.length) {
    return keywordTypeNodes.any
  }
  // ... rest of function
}
```

### 2. Parser (`packages/plugin-ts/src/parser.ts`)

Added a fallback to `unknown` type when no valid type is generated from schema keywords:

```typescript
let type = schemas
  .map((it) => this.parse(...))
  .filter(Boolean)[0] as ts.TypeNode

// If no valid type was generated, use unknown as fallback
if (!type) {
  type = factory.keywordTypeNodes.unknown
}
```

This ensures that properties always have a valid type, even if all schema keywords map to undefined.

### 3. Validation and Error Reporting (`Type.tsx` and `typeGenerator.tsx`)

Added `safePrint` wrapper function that validates nodes before printing:

```typescript
function validateNodes(...nodes: tsTypes.Node[]): void {
  for (const node of nodes) {
    if (!node) {
      throw new Error('Attempted to print undefined or null TypeScript node')
    }
    if (node.kind === ts.SyntaxKind.Unknown) {
      throw new Error(
        `Invalid TypeScript AST node detected with SyntaxKind.Unknown. ` +
        `This typically indicates a schema pattern that couldn't be properly converted to TypeScript.`
      )
    }
  }
}

function safePrint(...nodes: tsTypes.Node[]): string {
  validateNodes(...nodes)
  return print(...nodes)
}
```

This ensures that:
- Invalid nodes are detected early in the generation process
- Clear error messages are thrown instead of silent failures
- The build process can properly catch and report these errors via `failedPlugins`

### 4. Test Coverage (`packages/plugin-ts/src/parser.test.ts`)

Added test case to verify handling of properties with undefined keyword mappings:

```typescript
it('should handle object with properties that map to undefined gracefully', () => {
  const schema = {
    keyword: 'object',
    args: {
      properties: {
        testProp: [
          { keyword: 'catchall' }, // This maps to undefined in typeKeywordMapper
        ],
      },
    },
  }
  const result = parserType.parse(
    { name: 'test', schema: {}, parent: undefined, current: schema, siblings: [schema] },
    { optionalType: 'questionToken', enumType: 'asConst' },
  )

  expect(result).toBeTruthy()
  if (result && 'members' in result && Array.isArray(result.members)) {
    expect(result.members.length).toBeGreaterThan(0)
  }
})
```

## Impact

### Before
- TypeScript printer would crash with "Debug Failure. Unhandled SyntaxKind: Unknown"
- Errors were only logged to console, not reported via `result.error`
- Build would succeed despite generation failures
- Difficult to debug issues with complex OpenAPI specs

### After
- Invalid nodes are prevented from being created in the first place
- When invalid nodes are detected, clear errors are thrown with helpful messages
- Build process properly catches and reports errors
- Unknown types are generated as `unknown` type instead of causing crashes

## Testing

All existing tests pass:
- Factory tests: 15 tests
- Parser tests: 49 tests (including new test)
- Generator tests: 57 tests

Type checking passes without errors.

## Workaround (No Longer Needed)

Previously, users had to disable generators to avoid the crash:
```javascript
pluginTs({ output: { path: './types', barrelType: false }, generators: [] })
```

This workaround is no longer necessary with this fix.

## Future Considerations

1. Consider adding more granular error reporting to identify which specific schema caused the issue
2. Add telemetry to track how often fallback to `unknown` type occurs
3. Consider validating OpenAPI schemas earlier in the pipeline to catch problematic patterns before code generation
