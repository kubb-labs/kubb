# Kubb v4 vs v5 Output Comparison

> **Setup**: v5 uses `legacy: true` and `collisionDetection: false` to approximate v4 behavior.
> `interface` vs `type` keyword differences are **intentional** and excluded.

---

## Subtasks

Five independent issues remain. Each can be assigned to a separate agent.

### Task 1 — Restore `QueryParams` in aggregated mutation types ✅ DONE

**ID**: missing-mutation-queryparams | **Severity**: High | **Plugin**: plugin-ts

**Root cause**: `buildLegacyResponsesSchemaNode()` in `packages/plugin-ts/src/generators/utils.ts` used `else if (isGet && ...)` making `Request` and `QueryParams` mutually exclusive. Mutations with query params never got `QueryParams`.

**Fix**: Split the `if/else if` into two independent checks — `Request` is added for mutations with a body, `QueryParams` is added for any operation with query params. Both can coexist.

**Tests added**:
- `legacy — updatePetWithForm POST with query params and path params` (mutation, no body, has query params)
- `legacy — uploadFile POST with query params and request body` (mutation with both body and query params)

---

### Task 2 — Remove extra `*Enum` alias in legacy mode ✅ DONE

**ID**: legacy-extra-enum-alias | **Severity**: Medium | **Plugin**: plugin-ts

**Root cause**: `needsRefAlias` in `Enum.tsx` emitted the `*Enum = *EnumKey` alias unconditionally, regardless of legacy mode.

**Fix**: Added `legacy` prop to `Enum` and `Type` components. Threaded from `typeGenerator.tsx` options through to `Enum`. Gated `needsRefAlias` on `!legacy` — the alias is only emitted in non-legacy mode.

**Files changed**: `Enum.tsx`, `Type.tsx`, `typeGenerator.tsx`. Snapshots updated — legacy snapshots no longer contain the redundant alias.

---

### Task 3 — Fix aggregated type naming order with name transformers ✅ DONE

**ID**: zod-typed-name-order | **Severity**: High | **Plugin**: plugin-ts

**Root cause**: The legacy resolver's `resolveResponsesTypedName` passed the full `"operationId suffix"` string through `this.resolveTypedName()`, which applied `pascalCase` and then the user's name transformer to the entire string. This produced `AddPetMutationType` (transformer appends `Type` after `Mutation`). In v4, the transformer was applied to just the operationId first, then the suffix was appended, producing `AddPetTypeMutation`.

**Fix**: Changed `resolveResponsesTypedName` and `resolveResponsesName` in the legacy resolver to call `this.default(node.operationId, type)` first (applying the transformer to just the operationId), then append the `Query`/`Mutation` suffix. Without a transformer, the result is identical.

**Tests added**:
- `legacy — listPets GET with name transformer — Query suffix after Type` (verifies `ListPetsTypeQuery`)
- `legacy — addPet POST with name transformer — Mutation suffix after Type` (verifies `AddPetTypeMutation`)

---

### Task 4 — Generate named enums for tuple elements

**ID**: tuple-enum-inlined | **Severity**: Medium | **Plugin**: adapter-oas

**Problem**: For tuple types with enum elements (e.g. `Address.identifier`), v4 generates a named `as const` enum; v5 inlines them as literal unions.

```ts
// v4
export const addressIdentifierEnum = { NW: 'NW', NE: 'NE', SW: 'SW', SE: 'SE' } as const
export type AddressIdentifierEnumKey = (typeof addressIdentifierEnum)[keyof typeof addressIdentifierEnum]
export type Address = { identifier?: [number, string, AddressIdentifierEnumKey, ...any[]] }

// v5
export type Address = { identifier?: [number, string, 'NW' | 'NE' | 'SW' | 'SE'] }
```

Removes 2 exports (`addressIdentifierEnum`, `AddressIdentifierEnumKey`) and changes the tuple structure (drops `...any[]` rest).

**Root cause**: The OAS parser in `packages/adapter-oas/src/parser.ts` does not extract enum schemas from tuple/`prefixItems` elements when building the AST. The enum values are inlined as a union node instead of being emitted as a named enum schema node.

**Fix**: When parsing `prefixItems` (or `items` in tuple context), detect enum values and emit a named `EnumSchemaNode` the same way property enums are handled. Compare with v4 parser at `/home/stijnvanhulle/git/ext/v4/kubb/packages/plugin-oas/src/SchemaGenerator.ts` to see how it handles tuple enums. Also restore the `...any[]` rest element when `additionalItems` is not `false`.

**Verify**: Regenerate vue-query and faker examples. Confirm `addressIdentifierEnum` and `AddressIdentifierEnumKey` exports exist and the `Address.identifier` tuple matches v4.

---

### Task 5 — Verify parser issues are resolved

**ID**: verify-parser-fixes | **Severity**: Verification only

**Problem**: These four issues were listed as open but the E2E schema comparison (16 schemas) shows zero regressions. The described fixes appear to be present in the codebase:

| ID | Issue | Fix location |
|----|-------|-------------|
| E1 | Path param `$ref` typed as `any` | `parseParameter()` in `adapter-oas/src/parser.ts` |
| E3 | `const` discriminator → enum instead of literal | Enum handling in parser |
| E6 | Inline enum names missing parent prefix | `resolveChildName()` in `adapter-oas/src/parser.ts` |
| E7 | Query param inline enums inlined as literals | `parseParameter()` + `buildGroupedParamsSchema()` |

**Task**: Regenerate the E2E schemas (`pnpm generate` in `tests/e2e/`) and the v4 comparison output. Run `diff -r` between v5 and v4 output. Confirm all diffs are either `@type` annotation differences or v5 improvements. If any real regressions appear, open new issues with specific schema + file details. If clean, mark E1/E3/E6/E7 as resolved.

---

## Per-Example Name Comparison

| Example | Files match | v5 only | v4 only | Blocked by |
|---------|:----------:|:-------:|:-------:|------------|
| typescript | ✅ | 0 | 0 | ~~missing-mutation-queryparams~~ |
| react-query | ✅ | 5 | 0 | ~~missing-mutation-queryparams~~, ~~legacy-extra-enum-alias~~ |
| client | ✅ | 5 | 0 | ~~legacy-extra-enum-alias~~ |
| fetch | ✅ | 5 | 0 | ~~legacy-extra-enum-alias~~ |
| swr | ✅ | 5 | 0 | ~~missing-mutation-queryparams~~, ~~legacy-extra-enum-alias~~ |
| svelte-query | ✅ | 5 | 0 | ~~missing-mutation-queryparams~~, ~~legacy-extra-enum-alias~~ |
| solid-query | ✅ | 5 | 0 | ~~missing-mutation-queryparams~~, ~~legacy-extra-enum-alias~~ |
| vue-query | ✅ | 3 | 2 | ~~legacy-extra-enum-alias~~, tuple-enum-inlined |
| msw | ✅ | 5 | 0 | ~~legacy-extra-enum-alias~~ |
| faker | ✅ | 3 | 2 | ~~legacy-extra-enum-alias~~, tuple-enum-inlined |
| zod | ✅ | 30 | 22 | ~~legacy-extra-enum-alias~~, ~~zod-typed-name-order~~ |

---

## E2E Schema Summary

16 schemas compared using `plugin-ts`, `plugin-client`, `plugin-zod`.

| Schema | Files differ | @type only | Real diffs | Category |
|--------|:-----------:|:----------:|:----------:|----------|
| allOf | 3 | 3 | 0 | ✅ @type only |
| anyOf | 3 | 3 | 0 | ✅ @type only |
| dataset_api | 8 | 8 | 0 | ✅ @type only |
| discriminator | 14 | 14 | 0 | ✅ @type only |
| enums | 25 | 25 | 0 | ✅ @type only |
| jokesOne | 15 | 15 | 0 | ✅ @type only |
| nullable | 8 | 8 | 0 | ✅ @type only |
| optionalParameters | 1 | 1 | 0 | ✅ @type only |
| petStore | 24 | 20 | 4 | 🟢 v5 typed Errors |
| petStoreContent | 23 | 16 | 7 | 🟢 v5 typed Errors + cleaner collision |
| petStoreResponses | 3 | 3 | 0 | ✅ @type only |
| readme.io | 29 | 29 | 0 | ✅ @type only |
| requestBody | 2 | 2 | 0 | ✅ @type only |
| train-travel | 18 | 17 | 1 | 🟢 v5 fuller enum naming |
| worldtime | 14 | 2 | 12 | 🟢 v5 typed Errors |
| zalando | 44 | 44 | 0 | ✅ @type only |

12/16 zero real diffs. 4/16 are v5 improvements.

---

## Intentional Differences

**@type annotations** — v4 emitted `@type` on every property. v5 drops these by design.

**Typed error responses** — v5 resolves `Errors` types correctly where v4 used `any` (petStore, petStoreContent, worldtime).

**Cleaner enum collision** — v5 avoids numeric `2` suffix for enum names.

**Descriptive enum names** — v5 uses full parent chain for nested enum names.

---

## Resolved Issues

| ID | Description | Fix |
|----|-------------|-----|
| T1 | `@example` emitted in v5 | Suppressed when `legacy: true` |
| T4 | `(string & {})` instead of `string` | Replaced when `legacy: true` |
| T6 | `MutationResponse` placement | Reordered in `typeGenerator.tsx` |
| T7 | Missing `@description` on response alias | Added `requestBody.description` to AST |
| E2 | Discriminant not embedded in union | Added in `convertUnion()` / `convertAllOf()` |
| E5 | `null \| null` duplicated | Removed `nullable` from null-const case |
| @minLength | Extra `@minLength` on arrays | Skipped for array types |
| allOf-merge | Adjacent anonymous objects split | `mergeAdjacentAnonymousObjects()` for all allOf |

## By-Design Differences

| ID | Description |
|----|-------------|
| T2 | `@type` JSDoc dropped |
| T5 | `@type object` / format suffix dropped |
| N-AggType | `export interface` instead of `export type = {` |
| G-API | Generator context API changed (`pluginManager` → `driver`) |
| N-Path | Machine path in `.mcp.json` |
