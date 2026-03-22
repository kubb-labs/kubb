# Kubb v4 vs v5 Output Comparison Report

> **Methodology**: Generated output was compared recursively between v5 (`/tests/e2e/gen-compare/`) and v4 (`kubb-v4/tests/e2e/gen-compare/`) using per-schema configs that include `plugin-ts`, `plugin-client`, and `plugin-zod`.
> In v5, configs use `legacy: true` and `collisionDetection: false` to approximate v4 behaviour.
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
| `discriminator` | 14 | 14 | 0 | ✅ @type only |
| `enums` | 26 | 24 | 2 | **E6** enum prefix, **@minLength** |
| `jokesOne` | 15 | 15 | 0 | ✅ @type only |
| `nullable` | 8 | 8 | 0 | ✅ @type only |
| `optionalParameters` | 1 | 1 | 0 | ✅ @type only |
| `petStore` | 24 | 20 | 4 | **v5-better** Errors type |
| `petStoreContent` | 23 | 16 | 7 | **v5-better** Errors, **E6** enum collision |
| `petStoreResponses` | 3 | 3 | 0 | ✅ @type only |
| `readme.io` | 29 | 29 | 0 | ✅ @type only |
| `requestBody` | 2 | 2 | 0 | ✅ @type only |
| `train-travel` | 18 | 17 | 1 | **E6** enum prefix |
| `worldtime` | 14 | 2 | 12 | **v5-better** Errors type |
| `zalando` | 48 | 29 | 19 | **E6** enum prefix, **@minLength**, inline enum |
| `dataset_api` | 8 | 8 | 0 | ✅ @type only |

**10 of 16 schemas are fully resolved** (all remaining diffs are intentional `@type` removal).

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
| T1 | Medium | ✅ Fixed | plugin-ts | `@example` JSDoc emitted in v5, suppressed in v4 |
| T2 | — | ✅ By design | plugin-ts (all) | `@type` JSDoc annotation dropped in v5 |
| T3 | Low | ✅ Fixed | plugin-ts | Extra `XxxEnumKey` alias in v5 |
| T4 | Low | ✅ Fixed | plugin-ts | `(string & {})` open union instead of `string` |
| T5 | — | ✅ By design | plugin-ts (most) | `@type object` / format suffix not emitted in v5 |
| T6 | Low | ✅ Fixed | plugin-ts | `MutationResponse` placement in grouped type |
| T7 | Low | ✅ Fixed | plugin-ts | `@description` on response alias type |
| N-AggType | Medium | ✅ Fixed | plugin-ts | `export interface Xxx` instead of `export type Xxx = {` |
| N-QueryParams | Medium | ✅ Fixed | plugin-ts | `QueryParams` missing from aggregated operation type |
| E1 | High | ✅ Fixed | plugin-ts | Path param `$ref` typed as `any` instead of named type |
| E2 | Medium | ✅ Fixed | plugin-ts | Discriminant not embedded in union members |
| E3 | Medium | ✅ Fixed | plugin-ts | `const` discriminator values → enum+key type instead of literal |
| E5 | Low | ✅ Fixed | plugin-ts | `null \| null` duplicated from `null` const |
| E6 | 🟠 Medium | ❌ Open | plugin-ts | Inline enum names missing parent schema prefix |
| E7 | 🟠 Medium | ❌ Open | plugin-ts | Query param inline enums inlined as literals instead of named enums |
| N1-ZodTypeName | 🟠 Medium | ❌ Open | plugin-zod | Extra `Type` infix in zod-generated enum names |
| N-Path | Low | ⚠️ Expected | plugin-mcp | Absolute machine path in `.mcp.json` |
| G-API | Breaking | ℹ️ By design | custom generators | Generator context API changed |
| v5-better | 🟢 Improvement | ℹ️ v5 wins | plugin-ts | v5 resolves `Errors` type correctly; v4 uses `any` |
| @minLength | 🟡 Low | ❌ Open | plugin-ts | Extra `@minLength`/`@maxLength` on array properties |

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

v5 correctly resolves error response types where v4 emitted `Errors: any`:

| Schema | v5 | v4 |
|--------|----|----|
| `petStore` CreateUser | `Errors: CreateUserError` | `Errors: any` |
| `petStore` LogoutUser | `Errors: LogoutUserError` | `Errors: any` |
| `petStoreContent` CreateUser | `Errors: CreateUserError` | `Errors: any` |
| `petStoreContent` LogoutUser | `Errors: LogoutUserError` | `Errors: any` |
| `worldtime` (all 12 operations) | `Errors: Get*Error` | `Errors: any` |

These are genuine v5 improvements — not regressions.

---

## Fixed Issues (detail)

### T1 — `@example` JSDoc tags ✅ Fixed
v5 was emitting `@example` from OpenAPI `example` fields; v4 did not.
**Fix**: When `legacy: true`, the `@example` tag is suppressed in `packages/plugin-ts/src/printer.ts`.

### T3 — Extra enum type alias ✅ Fixed
v5 was generating an extra `export type FooKey = (typeof fooEnum)[...]` alias; v4 did not.
**Fix**: `needsRefAlias` gated on `!legacy` in `packages/plugin-ts/src/components/Enum.tsx`.

### T4 — `(string & {})` open string union ✅ Fixed
v5 emitted `(string & {})` for open string unions in enum types; v4 emitted plain `string`.
**Fix**: When `legacy: true`, `(string & {})` is replaced with `string` in `packages/plugin-ts/src/printer.ts`.

### T6 — `MutationResponse` alias placement ✅ Fixed
v5 emitted `MutationResponse` after the grouped `Mutation` type; v4 placed it before.
**Fix**: Reordered in `packages/plugin-ts/src/generators/typeGenerator.tsx`.

### T7 — `@description` on response alias ✅ Fixed
v5 was missing `@description` on error response type aliases generated from `requestBody.description`.
**Fix**: `requestBody.description` added to `OperationNode` AST and populated in `packages/adapter-oas/src/parser.ts`; used in `typeGenerator.tsx`.

### N-AggType — `export interface` vs `export type = {` ✅ Fixed
v5 was generating `export interface AddPetMutation { ... }` for aggregated operation types; v4 used `export type AddPetMutation = { ... }`.

### N-QueryParams — Missing `QueryParams` in aggregated type ✅ Fixed
Operations with query params were missing `QueryParams: XxxQueryParams` in the v5 aggregated type.

### E1 — Path param `$ref` schema types as `any` ✅ Fixed
Path parameters using `schema: { $ref: '...' }` were typed as `any` instead of their named type.
**Fix**: `parseParameter()` in `packages/adapter-oas/src/parser.ts` now uses `convertSchema` for `$ref` parameters.

### E2 — Discriminant not embedded in union members ✅ Fixed
v5 was generating plain unions (`Cat | Dog`) without intersecting each member with its discriminator value.
**Fix**: Added discriminant embedding in `convertUnion()` and `convertAllOf()` in `packages/adapter-oas/src/parser.ts`.

### E3 — `const` discriminator values → enum type ✅ Fixed
v5 was treating `const` properties as named enums with an `as const` export; v4 emitted inline literals.
**Fix**: Added `fromConst: true` flag to `EnumSchemaNode`. In legacy mode, `fromConst` enums emit as inline literals.

### E5 — `null | null` duplicated null type ✅ Fixed
`const: null` schemas were generating `null | null`.
**Fix**: Removed `nullable` from the null-const case; fixed `convertObject()` to skip nullable for null types.

---

## Open Issues (detail)

### E6 — Inline enum names missing parent schema prefix 🟠 MEDIUM
**Scope**: `enums` (ZoningDistrictClassCategory), `train-travel` (BookingPayment), `zalando` (Article), `petStoreContent` (Order, Pet).

v5 names inline property enums by their property name alone; v4 prefixed the parent schema name.

```ts
// v5
export const ageGroupsEnum = { ... } as const;
export const accountTypeEnum = { ... } as const;

// v4
export const articleAgeGroupsEnum = { ... } as const;
export const sourceAccountTypeEnum = { ... } as const;
```

With `collisionDetection: false`, two schemas with the same property name would collide on the same enum name. v4 included the parent context as prefix.

Related: `petStoreContent` has `orderStatusEnum` vs `orderStatusEnum2` and `petStatusEnum` vs `petStatusEnum2` — v4 added numeric suffix to avoid collision; v5 doesn't detect the collision.

### E7 — Query param inline enums inlined as literals instead of named enums 🟠 MEDIUM
**Scope**: `zalando` (GetArticles, GetFacets), `petStoreContent` (FindPetsByStatus).

v4 generated named `as const` enum objects for query param inline enums (e.g. `GetFacetsQueryParamsAgeGroupEnum`). v5 inlines these as literal unions.

```ts
// v5
upperMaterial?: ("canvas" | "cotton" | ...)[];

// v4
upperMaterial?: GetFacetsQueryParamsUpperMaterialEnumKey[];
// with: export const getFacetsQueryParamsUpperMaterialEnum = { ... } as const;
```

For `petStoreContent`, v5 emits `status?: any` while v4 correctly had `status?: FindPetsByStatusQueryParamsStatusEnum2Key` with a `@default "available"`.

### @minLength — Extra `@minLength`/`@maxLength` on array properties 🟡 LOW
**Scope**: `zalando` (many files), `enums` (Position).

v5 emits `@minLength` / `@maxLength` on array-typed properties where v4 did not:

```ts
// v5 (extra)
/**
 * @minLength 0
 * @minLength 1
 */
ageGroups: AgeGroupsEnumKey[];

// v4 (no annotation)
ageGroups: ArticleAgeGroupsEnumKey[];
```

This appears to be v5 applying `minItems`/`maxItems` from the OAS array schema as `@minLength`/`@maxLength` JSDoc. v4 did not annotate these. Additionally, `Position.ts` has `@minLength 2 / @maxLength 3` in v5 vs `@example -74.010835,40.708442` in v4.

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

## Priority Fix Order

| Priority | Issue | Schemas Affected |
|----------|-------|-----------------|
| 1 | **E6** — enum prefix missing | enums, train-travel, zalando, petStoreContent |
| 2 | **E7** — query param enums inlined | zalando, petStoreContent |
| 3 | **N1-ZodTypeName** — `Type` infix | zod |
| 4 | **@minLength** — array min/max as minLength | zalando, enums |
