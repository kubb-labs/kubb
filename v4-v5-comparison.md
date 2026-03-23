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

### Task 2 — Remove extra `*Enum` alias in legacy mode

**ID**: legacy-extra-enum-alias | **Severity**: Medium | **Plugin**: plugin-ts

**Problem**: For `asConst` enum types, v5 exports a redundant `export type FooEnum = FooEnumKey` alias that v4 does not have. This is additive (non-breaking) but pollutes the API.

```ts
// v5 — extra export (not in v4)
export type OrderStatusEnum = OrderStatusEnumKey
```

Affects 5 enum names across 9 examples, plus 8 `*EnumType` names in the zod example.

**Root cause**: `packages/plugin-ts/src/components/Enum.tsx` (line ~64):

```ts
const needsRefAlias = ENUM_TYPES_WITH_KEY_SUFFIX.has(enumType) && refName !== typeName
```

This emits the alias unconditionally. In legacy mode it should be suppressed.

**Fix**: Gate `needsRefAlias` on `!legacy`. The `legacy` option is available via the plugin options context. When `legacy: true`, skip the `refName` alias emission.

**Verify**: Regenerate react-query example. Confirm `OrderStatusEnum`, `PetStatusEnum`, etc. no longer appear as separate exports. The `OrderStatusEnumKey` type and `orderStatusEnum` const should still exist.

---

### Task 3 — Fix zod operation type naming order

**ID**: zod-typed-name-order | **Severity**: High | **Plugin**: plugin-zod

**Problem**: The aggregated operation type names in the zod `typed` output changed word order from v4.

```ts
// v4
export type AddPetTypeMutation = { ... }
export type GetPetByIdTypeQuery = { ... }

// v5
export type AddPetMutationType = { ... }
export type GetPetByIdQueryType = { ... }
```

22 operation types are affected. This is a breaking rename for consumers importing by name.

**Root cause**: The legacy resolver in `packages/plugin-ts/src/resolver.ts` (line ~148) resolves `resolveResponsesTypedName(node)` as `resolveTypedName("addPet Mutation")`. When the zod plugin's `typed` mode adds the `Type` suffix, it appends it after the full name → `AddPetMutationType`. In v4, `Type` was inserted before the operation suffix → `AddPetTypeMutation`.

The naming depends on how `resolveTypedName` in the zod context composes the `Type` suffix with the operation kind suffix (`Mutation`/`Query`).

**Fix**: In legacy mode, the zod resolver (or the legacy TS resolver when running under zod `typed` context) should produce `${operationId}Type${suffix}` instead of `${operationId}${suffix}Type`. Check `packages/plugin-zod/src/plugin.ts` `resolveName()` and how it interacts with the TS resolver. Compare with the v4 zod plugin resolver at `/home/stijnvanhulle/git/ext/v4/kubb/packages/plugin-zod/src/plugin.ts`.

**Verify**: Regenerate zod example. Confirm `AddPetTypeMutation`, `GetPetByIdTypeQuery`, etc. match v4 names.

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
| react-query | ✅ | 5 | 0 | ~~missing-mutation-queryparams~~, legacy-extra-enum-alias |
| client | ✅ | 5 | 0 | legacy-extra-enum-alias |
| fetch | ✅ | 5 | 0 | legacy-extra-enum-alias |
| swr | ✅ | 5 | 0 | ~~missing-mutation-queryparams~~, legacy-extra-enum-alias |
| svelte-query | ✅ | 5 | 0 | ~~missing-mutation-queryparams~~, legacy-extra-enum-alias |
| solid-query | ✅ | 5 | 0 | ~~missing-mutation-queryparams~~, legacy-extra-enum-alias |
| vue-query | ✅ | 3 | 2 | legacy-extra-enum-alias, tuple-enum-inlined |
| msw | ✅ | 5 | 0 | legacy-extra-enum-alias |
| faker | ✅ | 3 | 2 | legacy-extra-enum-alias, tuple-enum-inlined |
| zod | ✅ | 30 | 22 | legacy-extra-enum-alias, zod-typed-name-order |

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
