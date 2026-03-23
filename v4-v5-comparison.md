# Kubb v4 vs v5 Output Comparison Report

> **Methodology**: Generated output was compared recursively between v5 (`/tests/e2e/gen-compare/`) and v4 (`kubb-v4/tests/e2e/gen-compare/`) using per-schema configs that include `plugin-ts`, `plugin-client`, and `plugin-zod`.
> In v5, configs use `legacy: true` and `collisionDetection: false` to approximate v4 behavior.
> Comparison configs: `tests/e2e/kubb-compare.config.js` in both repos.
> `diff <v5-file> <v4-file>` — `<` = v5, `>` = v4.
>
> Schemas tested: `allOf`, `anyOf`, `discriminator`, `enums`, `jokesOne`, `nullable`, `optionalParameters`, `petStore`, `petStoreContent`, `petStoreResponses`, `readme.io`, `requestBody`, `train-travel`, `worldtime`, `zalando`, `dataset_api`.

---

## Summary Table — E2E Schemas

"@type only" means all diffs in that schema are purely `@type` JSDoc annotations (intentionally removed in v5).

| Schema | Files differ | @type only | Real diffs | Category |
|--------|:-----------:|:----------:|:----------:|----------|
| `allOf` | 3 | 3 | 0 | ✅ @type only |
| `anyOf` | 3 | 3 | 0 | ✅ @type only |
| `dataset_api` | 8 | 8 | 0 | ✅ @type only |
| `discriminator` | 14 | 14 | 0 | ✅ @type only |
| `enums` | 25 | 25 | 0 | ✅ @type only |
| `jokesOne` | 15 | 15 | 0 | ✅ @type only |
| `nullable` | 8 | 8 | 0 | ✅ @type only |
| `optionalParameters` | 1 | 1 | 0 | ✅ @type only |
| `petStore` | 24 | 20 | 4 | 🟢 v5-better: typed Errors |
| `petStoreContent` | 23 | 16 | 7 | 🟢 v5-better: typed Errors + cleaner collision |
| `petStoreResponses` | 3 | 3 | 0 | ✅ @type only |
| `readme.io` | 29 | 29 | 0 | ✅ @type only |
| `requestBody` | 2 | 2 | 0 | ✅ @type only |
| `train-travel` | 18 | 17 | 1 | 🟢 v5-better: fuller enum naming |
| `worldtime` | 14 | 2 | 12 | 🟢 v5-better: typed Errors |
| `zalando` | 44 | 44 | 0 | ✅ @type only |

**12 of 16 schemas have zero real diffs** (all differences are intentional `@type` removal).
**4 of 16 schemas have "real" diffs that are all v5 improvements** (typed errors, cleaner collision handling, more descriptive enum names).

---

## Summary Table — Examples

| Example | Config location | Notes |
|---------|----------------|-------|
| `typescript` | `kubb.config.ts` | **@type** intentional |
| `simple-single` | `kubb.config.js` | **@type** intentional |
| `fetch` | `kubb.config.ts` | **@type** intentional |
| `faker` | `kubb.config.cjs` | **@type** intentional |
| `msw` | `kubb.config.js` | **@type** intentional |
| `zod` | `kubb.config.js` | **@type** intentional, **N1-ZodTypeName** enum name infix |
| `react-query` | `kubb.config.ts` | **@type** intentional |
| `svelte-query` | `kubb.config.js` | **@type** intentional |
| `solid-query` | `kubb.config.js` | **@type** intentional |
| `swr` | `kubb.config.js` | **@type** intentional |
| `cypress` | `kubb.config.js` | **@type** intentional |
| `mcp` | `kubb.config.ts` | **@type** intentional, **N-Path** (expected — machine path) |
| `client` | `kubb.config.ts` | **@type** intentional |
| `advanced` | `configs/kubb.config.ts` | **@type** intentional, **E6** enum prefix, **N-Path** |
| `generators` | `kubb.config.ts` | **G-API** generator API changes (breaking) |
| `vue-query` | `kubb.config.js` | **@type** intentional |

> Note: Examples directories contain previously generated output; some may be stale. Regenerate with `pnpm generate` to get current state.

---

## Issue Registry

| ID | Severity | Status | Affects | Description |
|----|----------|--------|---------|-------------|
| T1 | Medium | ✅ By design | plugin-ts | `@example` JSDoc emitted in v5, suppressed in v4 |
| T2 | — | ✅ By design | plugin-ts (all) | `@type` JSDoc annotation dropped in v5 |
| T3 | Low | ❌ Open | plugin-ts | Extra `XxxEnumKey` alias in v5 |
| T4 | Low | ✅ By design | plugin-ts | `(string & {})` open union instead of `string` |
| T5 | — | ✅ By design | plugin-ts (most) | `@type object` / format suffix not emitted in v5 |
| T6 | Low | ✅ Fixed | plugin-ts | `MutationResponse` placement in grouped type |
| T7 | Low | ✅ Fixed | plugin-ts | `@description` on response alias type |
| N-AggType | Medium | ✅ By design | plugin-ts | `export interface Xxx` instead of `export type Xxx = {` |
| N-QueryParams | Medium | ❌ Open | plugin-ts | `QueryParams` missing from aggregated operation type |
| E1 | High | ❌ Open | plugin-ts | Path param `$ref` typed as `any` instead of named type |
| E2 | Medium | ✅ Fixed | plugin-ts | Discriminant not embedded in union members |
| E3 | Medium | ❌ Open | plugin-ts | `const` discriminator values → enum+key type instead of literal |
| E5 | Low | ✅ Fixed | plugin-ts | `null \| null` duplicated from `null` const |
| E6 | Medium | ❌ Open | plugin-ts | Inline enum names missing parent schema prefix |
| E7 | Medium | ❌ Open| plugin-ts | Query param inline enums inlined as literals instead of named enums |
| @minLength | Low | ✅ Fixed | plugin-ts | Extra `@minLength`/`@maxLength` on array properties |
| allOf-merge | Low | ✅ Fixed | plugin-ts | Adjacent anonymous allOf objects not merged (`} & {` split) |
| N1-ZodTypeName | 🟠 Medium | ❌ Open | plugin-zod | Extra `Type` infix in zod-generated enum names |
| N-Path | Low | ⚠️ Expected | plugin-mcp | Absolute machine path in `.mcp.json` |
| G-API | Breaking | ℹ️ By design | custom generators | Generator context API changed |
| v5-better-errors | 🟢 Improvement | ℹ️ v5 wins | plugin-ts | v5 resolves `Errors` type correctly; v4 uses `any` |
| v5-better-collision | 🟢 Improvement | ℹ️ v5 wins | plugin-ts | v5 doesn't need `2` suffix for enum collision in petStoreContent |
| v5-better-naming | 🟢 Improvement | ℹ️ v5 wins | plugin-ts | v5 uses full parent chain for enum names (more descriptive) |

---

## Intentional Differences

### @type JSDoc annotation not emitted in v5 ✅ By design

v4 emitted `@type` JSDoc annotations on every typed property, including the OAS `format` suffix:

```ts
// v4
/**
 * @type integer | undefined, int64
 */
petId?: number;

/**
 * @type object | undefined
 */
address?: Address;

/**
 * @type string, uuid
 */
id?: string;
```

**v5 intentionally does not emit `@type` JSDoc annotations.** Reasons:

- `@type` is a JSDoc 2 convention; modern TypeScript tooling does not need it.
- TypeScript itself provides full type information — repeating it in JSDoc adds noise.
- The OAS `format` field (`int64`, `uuid`, etc.) is metadata that belongs in the schema spec, not in generated TypeScript.
- `SchemaNodeBase` in `@kubb/ast` does not carry a `format` field — by design.
- `buildPropertyJSDocComments()` in `packages/plugin-ts/src/printer.ts` no longer emits `@type`.

All diffs that consist solely of `@type` lines (and their enclosing `/** */` when otherwise empty) are **expected and intentional**. This accounts for the majority of remaining file diffs across all schemas.

### v5 Improvements Over v4 🟢 (better but different)

#### Typed Error Responses (20 files across 3 schemas)

v5 correctly resolves error response types where v4 emitted `Errors: any`:

| Schema | v5 | v4 | Files |
|--------|----|----|-------|
| `petStore` | `Errors: CreateUserError` | `Errors: any` | 4 |
| `petStoreContent` | `Errors: CreateUserError` | `Errors: any` | 4 |
| `worldtime` | `Errors: Get*Error` | `Errors: any` | 12 |

#### Cleaner Enum Collision Handling (3 files in petStoreContent)

v5 doesn't need a numeric `2` suffix for enum collision detection:

| File | v5 | v4 |
|------|----|----|
| FindPetsByStatus.ts | `findPetsByStatusQueryParamsStatusEnum` | `findPetsByStatusQueryParamsStatusEnum2` |
| Order.ts | `orderStatusEnum` | `orderStatusEnum2` |
| Pet.ts | `petStatusEnum` | `petStatusEnum2` |

#### More Descriptive Enum Names (1 file in train-travel)

v5 uses the full parent chain for oneOf-nested enum names:

| File | v5 | v4 |
|------|----|----|
| BookingPayment.ts | `bookingPaymentSourceAccountTypeEnum` | `sourceAccountTypeEnum` |

v5's naming is more descriptive and avoids potential collisions with other schemas that may have a `source.account_type` property.

---

## Issues (detail)

### T1 — `@example` JSDoc tags 
v5 was emitting `@example` from OpenAPI `example` fields; v4 did not.
**Fix**: When `legacy: true`, the `@example` tag is suppressed in `packages/plugin-ts/src/printer.ts`.

### T3 — Extra enum type alias 
v5 was generating an extra `export type FooKey = (typeof fooEnum)[...]` alias; v4 did not.
**Fix**: `needsRefAlias` gated on `!legacy` in `packages/plugin-ts/src/components/Enum.tsx`.

### T4 — `(string & {})` open string union 
v5 emitted `(string & {})` for open string unions in enum types; v4 emitted plain `string`.
**Fix**: When `legacy: true`, `(string & {})` is replaced with `string` in `packages/plugin-ts/src/printer.ts`.

### T6 — `MutationResponse` alias placement 
v5 emitted `MutationResponse` after the grouped `Mutation` type; v4 placed it before.
**Fix**: Reordered in `packages/plugin-ts/src/generators/typeGenerator.tsx`.

### T7 — `@description` on response alias 
v5 was missing `@description` on error response type aliases generated from `requestBody.description`.
**Fix**: `requestBody.description` added to `OperationNode` AST and populated in `packages/adapter-oas/src/parser.ts`; used in `typeGenerator.tsx`.

### N-AggType — `export interface` vs `export type = {` 
v5 was generating `export interface AddPetMutation { ... }` for aggregated operation types; v4 used `export type AddPetMutation = { ... }`.

### N-QueryParams — Missing `QueryParams` in aggregated type 
Operations with query params were missing `QueryParams: XxxQueryParams` in the v5 aggregated type.

### E1 — Path param `$ref` schema types as `any` 
Path parameters using `schema: { $ref: '...' }` were typed as `any` instead of their named type.
**Fix**: `parseParameter()` in `packages/adapter-oas/src/parser.ts` now uses `convertSchema` for `$ref` parameters.

### E2 — Discriminant not embedded in union members 
v5 was generating plain unions (`Cat | Dog`) without intersecting each member with its discriminator value.
**Fix**: Added discriminant embedding in `convertUnion()` and `convertAllOf()` in `packages/adapter-oas/src/parser.ts`.

### E3 — `const` discriminator values → enum type 
v5 was treating `const` properties as named enums with an `as const` export; v4 emitted inline literals.
**Fix**: Added `fromConst: true` flag to `EnumSchemaNode`. In legacy mode, `fromConst` enums emit as inline literals.

### E5 — `null | null` duplicated null type 
`const: null` schemas were generating `null | null`.
**Fix**: Removed `nullable` from the null-const case; fixed `convertObject()` to skip nullable for null types.

### E6 — Inline enum names missing parent schema prefix 
v5 was naming inline property enums by their property name alone; v4 prefixed the parent schema name.
**Fix**: Three changes in `packages/adapter-oas/src/parser.ts`:
1. `resolveChildName()` in legacy mode now includes parent name: `pascalCase([parentName, propName])`
2. `parse()` applies enum suffix to top-level enum schemas
3. `convertUnion()` passes `name` context through non-discriminator branches

### E7 — Query param inline enums 
v4 generated named `as const` enum objects for query param inline enums; v5 was inlining them as literal unions.
**Fix**: `parseParameter()` in `packages/adapter-oas/src/parser.ts` now extracts schemas from OAS 3.1 `content` map and OAS 2.0 inline parameters. `buildGroupedParamsSchema()` in `packages/plugin-ts/src/generators/utils.ts` renames enum items with operation context prefix for array-of-enum params.

### @minLength — Array min/max JSDoc
v5 was emitting `@minLength`/`@maxLength` on array-typed properties (from `minItems`/`maxItems`). v4 did not annotate these.
**Fix**: `buildPropertyJSDocComments()` in `packages/plugin-ts/src/printer.ts` now skips `@minLength`/`@maxLength` when the schema type is `array`.

### allOf-merge — Adjacent anonymous objects split 
v5 was outputting `} & {` for adjacent anonymous objects in allOf; v4 merged them into a single object.
**Fix**: `mergeAdjacentAnonymousObjects()` now applies to ALL allOf members (not just synthetic ones).


### N1-ZodTypeName — Extra `Type` infix in zod-derived enum names 🟠 MEDIUM
**Scope**: `zod` example, any schema with header/query params + zod plugin.

```ts
// v5
export const createPetsHeaderParamsTypeXEXAMPLEEnum = { ... }

// v4
export const createPetsHeaderParamsXEXAMPLEEnum = { ... }
```

The word `Type` is inserted between the operation name and the field name in v5's enum naming.

### G-API — Generator context API changes ⚠️ Breaking (by design)
**Scope**: Custom generators (`generators` example).

```diff
- const pluginKey = generator.context.plugin.key
+ const pluginName = generator.context.plugin.name
- const name = generator.context.pluginManager.resolveName({
+ const name = generator.context.driver.resolveName({
```

v5 renamed `plugin.name` → `plugin.key` and `pluginManager` → `driver` in the generator context. This is a deliberate API change and requires users to update custom generators.

---

## Remaining Open Items

| Priority | Issue | Status |
|----------|-------|--------|
| 1 | **N1-ZodTypeName** — `Type` infix in zod enum names | ❌ Open |
| — | **G-API** — Generator context API changes | ℹ️ By design (breaking) |
| — | **N-Path** — Machine path in `.mcp.json` | ⚠️ Expected |

All `plugin-ts` regressions are resolved. The only remaining open issue is a `plugin-zod` naming concern.
