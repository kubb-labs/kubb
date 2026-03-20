# E2E Typecheck Failures — Investigation & Fix Plan

## Overview

Running `pnpm run generate` in `tests/e2e/` processes 17 schemas sequentially. Each schema generates code and then runs `npm run typecheck`. **5 out of 17 schemas fail typecheck.** The failures fall into **4 distinct bug categories**, each suitable for a separate PR.

## Test Results Summary

| Schema | Generate | Typecheck | Bug Category |
|--------|----------|-----------|--------------|
| train-travel | ✅ | ✅ | — |
| discriminator | ✅ | ✅ | — |
| optionalParameters | ✅ | ✅ | — |
| **allOf** | ✅ | ❌ | Bug 1: $ref name lost in allOf flatten |
| anyOf | ✅ | ✅ | — |
| petStoreContent | ✅ | ✅ | — |
| **twitter** | ✅ | ❌ | Bug 2 + Bug 3 |
| jokesOne | ✅ | ✅ | — |
| readme.io | ✅ | ✅ | — |
| worldtime | ✅ | ✅ | — |
| zalando | ✅ | ✅ | — |
| requestBody | ✅ | ✅ | — |
| **box** | ✅ | ❌ | Bug 4: undefined tag + dot in operationId |
| **enums** | ✅ | ❌ | Bug 3: asConst enum import mismatch |
| dataset_api | ✅ | ✅ | — |
| **Figma** | ✅ | ❌ | Bug 3: asConst enum import mismatch |
| petStoreV3 | ✅ | ✅ | — |

---

## Bug 1: `$ref` name lost when `allOf` wraps a single `$ref` (property name override)

**Affected schemas:** `allOf`
**Error count:** 1 error

### Error

```
gen/models/ts/CreateTestRequest.ts(9,13): error TS2304: Cannot find name 'Content'.
```

### Root Cause

In `allOf.json`, `CreateTestRequest.content` is defined as:

```json
"content": {
  "allOf": [{ "$ref": "#/components/schemas/TestContent" }],
  "nullable": true
}
```

The parser in `packages/adapter-oas/src/parser.ts` does two things:
1. Derives a child name from the property name `"content"` → PascalCase → `"Content"`
2. Processes the `allOf`, which extracts the `$ref` name as `"TestContent"`

When the single-member `allOf` is flattened, the **property-derived child name `"Content"` overrides the actual `$ref` name `"TestContent"`**. The generated type references `Content` instead of importing `TestContent`.

### Fix Location

`packages/adapter-oas/src/parser.ts` — the `allOf` flattening logic (around line 341-366). When a single-member `allOf` contains only a `$ref`, the ref's extracted name should take precedence over the property-derived child name.

### Generated Output (broken)

```typescript
// CreateTestRequest.ts
import type { TestName } from './TestName.ts'
// Missing: import type { TestContent } from './TestContent.ts'

export type CreateTestRequest = {
  content?: Content | null  // ← 'Content' is undefined, should be 'TestContent'
  name: TestName
  place?: string
}
```

---

## Bug 2: Circular type alias from discriminator + single-member `allOf`

**Affected schemas:** `twitter`
**Error count:** 8 errors (8 Problem subtypes)

### Errors

```
gen/models/ts/ClientDisconnectedProblem.ts(11,13): error TS2456: Type alias 'ClientDisconnectedProblem' circularly references itself.
gen/models/ts/ConflictProblem.ts(11,13): error TS2456: Type alias 'ConflictProblem' circularly references itself.
gen/models/ts/GenericProblem.ts(11,13): error TS2456: Type alias 'GenericProblem' circularly references itself.
gen/models/ts/InvalidRuleProblem.ts(11,13): error TS2456: Type alias 'InvalidRuleProblem' circularly references itself.
gen/models/ts/NonCompliantRulesProblem.ts(11,13): error TS2456: Type alias 'NonCompliantRulesProblem' circularly references itself.
gen/models/ts/Oauth1PermissionsProblem.ts(11,13): error TS2456: Type alias 'Oauth1PermissionsProblem' circularly references itself.
gen/models/ts/RulesCapProblem.ts(11,13): error TS2456: Type alias 'RulesCapProblem' circularly references itself.
gen/models/ts/UnsupportedAuthenticationProblem.ts(11,13): error TS2456: Type alias 'UnsupportedAuthenticationProblem' circularly references itself.
```

### Root Cause

The Twitter API schema defines a `Problem` base type with a discriminator mapping:

```json
"Problem": {
  "type": "object",
  "properties": { "detail": ..., "status": ..., "title": ..., "type": ... },
  "discriminator": {
    "propertyName": "type",
    "mapping": {
      "about:blank": "#/components/schemas/GenericProblem",
      "https://api.twitter.com/.../client-disconnected": "#/components/schemas/ClientDisconnectedProblem",
      ...
    }
  }
}
```

And child types are defined as single-member `allOf` referencing `Problem`:

```json
"ClientDisconnectedProblem": {
  "allOf": [{ "$ref": "#/components/schemas/Problem" }]
}
```

The parser's circular reference detection (lines 368-380) checks for `oneOf`/`anyOf` on the parent. But `Problem` has **neither** — it's a plain object with a discriminator mapping. The detection fails, and:

1. `ClientDisconnectedProblem` flattens to just `Problem` (single-member allOf)
2. `Problem` resolves to a discriminated union including `ClientDisconnectedProblem`
3. → Circular reference: `ClientDisconnectedProblem = Problem = ... | ClientDisconnectedProblem | ...`

### Fix Location

`packages/adapter-oas/src/parser.ts` — Two possible fixes:

1. **Extend circular detection** (lines 368-380): Also check `discriminator.mapping` when there's no `oneOf`/`anyOf` on the referenced schema
2. **Prevent flattening**: Don't flatten single-member `allOf` when the referenced schema has a discriminator and the current schema appears in that discriminator's mapping

---

## Bug 3: `enumType: 'asConst'` — import name doesn't match export name

**Affected schemas:** `twitter` (3 errors), `enums` (2 errors), `Figma` (35 errors)
**Error count:** 40 errors total

### Errors (representative samples)

```
gen/models/ts/ZoningDistrictClass.ts: error TS2724: '"./ZoningDistrictClassCategory.ts"' has no exported member named 'ZoningDistrictClassCategory'. Did you mean 'zoningDistrictClassCategory'?
gen/models/ts/ComplianceJob.ts: error TS2724: '"./ComplianceJobStatus.ts"' has no exported member named 'ComplianceJobStatus'. Did you mean 'complianceJobStatus'?
gen/models/ts/ActivityLogFileEntity.ts: error TS2724: '"./LinkAccess.ts"' has no exported member named 'LinkAccess'. Did you mean 'linkAccess'?
```

### Root Cause

With `enumType: 'asConst'`, the generated enum file exports:

```typescript
// ZoningDistrictClassCategory.ts
export const zoningDistrictClassCategory = { ... } as const;           // camelCase
export type ZoningDistrictClassCategoryKey = typeof zoningDistrictClassCategory[...];  // PascalCase + "Key"
```

But importing files reference the **PascalCase name without suffix**:

```typescript
// ZoningDistrictClass.ts
import type { ZoningDistrictClassCategory } from './ZoningDistrictClassCategory.ts'  // ← DOESN'T EXIST
```

The mismatch happens because:

1. **Export name** (`Enum.tsx` `getEnumNames()`): For `asConst`, `enumName` uses `camelCase(node.name)` → `zoningDistrictClassCategory`. The type uses `PascalCase + "Key"` suffix → `ZoningDistrictClassCategoryKey`.
2. **Import name** (`typeGenerator.tsx` + `adapter getImports`): Uses `resolveName({ name, type: 'type' })` which always returns `PascalCase(name)` → `ZoningDistrictClassCategory`. This matches neither export.

The import system doesn't know about the `"Key"` suffix convention used by `asConst` enums.

### Fix Location

The import resolution for enum references needs to be aware of `enumType`. When `enumType === 'asConst'`:
- The type reference in imports should use `${PascalCase(name)}Key` (matching the exported type alias)
- Files to check:
  - `packages/plugin-ts/src/printer.ts` — `ref()` and `enum()` methods (how type references are generated)
  - `packages/plugin-ts/src/generators/v2/typeGenerator.tsx` — how `getImports` resolves names
  - `packages/plugin-ts/src/components/v2/Enum.tsx` — the `getEnumNames()` function

---

## Bug 4: Undefined tag group + dot in operationId produces broken paths

**Affected schemas:** `box`
**Error count:** 6 errors

### Errors

```
gen/clients/axios/undefinedService/getEnterpriseConfigurationsIdV2025/0.ts: error TS2307: Cannot find module '../../../../models/ts/undefinedController/getEnterpriseConfigurationsIdV2025/0.ts'
```

### Root Cause — Two separate issues:

#### 4a: `undefinedController` / `undefinedService`

The Box API operation at `/enterprise_configurations/{enterprise_id}` has **no `tags` array**:

```json
{
  "operationId": "get_enterprise_configurations_id_v2025.0",
  // tags is MISSING (other Box ops use x-box-tag vendor extension)
}
```

When `group: { type: 'tag' }` is configured, the code reads `operation.getTags().at(0)?.name` which returns `undefined`. This `undefined` gets passed to `camelCase()` which produces the literal string `"undefined"`, resulting in folder names like `undefinedController/`, `undefinedService/`, `undefinedRequests/`.

#### 4b: File named `0.ts` from dot in operationId

The operationId `get_enterprise_configurations_id_v2025.0` contains a dot. The file-naming casing function (`internals/utils/src/casing.ts`) splits on `.` when `isFile: true`:

```
"get_enterprise_configurations_id_v2025.0"
  → split('.') → ["get_enterprise_configurations_id_v2025", "0"]
  → join('/') → "getEnterpriseConfigurationsIdV2025/0"
  → file: getEnterpriseConfigurationsIdV2025/0.ts
```

This creates a nested path that breaks module resolution because `models/ts/undefinedController/getEnterpriseConfigurationsIdV2025/0.ts` doesn't exist (the TypeScript plugin generates under a different group structure).

### Fix Locations

- **4a**: `packages/plugin-oas/src/hooks/useOperationManager.ts` (line ~82) — Add fallback when `tags` is empty. Options: use operation path as group, use a default group name like `"default"`, or skip grouping.
- **4b**: `internals/utils/src/casing.ts` (line ~42-45) — The dot-splitting logic for `isFile` should be reconsidered for operationIds that naturally contain version numbers with dots.

---

## Proposed PR Breakdown

### PR 1: Fix `$ref` name override in single-member `allOf` flatten (Bug 1)
- **Files**: `packages/adapter-oas/src/parser.ts`
- **Tests**: Add test case with `allOf` wrapping a single `$ref` where property name differs from schema name
- **Fixes**: `allOf` schema typecheck

### PR 2: Fix circular reference in discriminator without `oneOf`/`anyOf` (Bug 2)
- **Files**: `packages/adapter-oas/src/parser.ts`
- **Tests**: Add test case with discriminator mapping where child types use single-member `allOf`
- **Fixes**: `twitter` schema circular reference errors

### PR 3: Fix `asConst` enum import/export name mismatch (Bug 3)
- **Files**: `packages/plugin-ts/src/printer.ts`, `packages/plugin-ts/src/generators/v2/typeGenerator.tsx`, `packages/plugin-ts/src/components/v2/Enum.tsx`
- **Tests**: Add test with `asConst` enum referenced by another type
- **Fixes**: `enums`, `Figma`, and `twitter` schema enum errors (40 errors total — **biggest impact**)

### PR 4: Handle missing tags and dots in operationId (Bug 4)
- **Files**: `packages/plugin-oas/src/hooks/useOperationManager.ts`, `internals/utils/src/casing.ts`
- **Tests**: Add test with tagless operation and operationId containing dots
- **Fixes**: `box` schema errors

## Priority Order

1. **PR 3** (asConst enum mismatch) — Fixes 40 errors across 3 schemas, highest impact
2. **PR 2** (circular discriminator) — Fixes 8 errors in twitter
3. **PR 1** (allOf $ref name) — Fixes 1 error in allOf
4. **PR 4** (undefined tag + dot operationId) — Fixes 6 errors in box, may require design decision on fallback behavior
