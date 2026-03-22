# Kubb v4 vs v5 Output Comparison Report

> **Methodology**: Generated output was compared recursively between v5 (`/tests/e2e/gen-compare/`) and v4 (`kubb-v4/tests/e2e/gen-compare/`) using per-schema configs that include `plugin-ts`, `plugin-client`, and `plugin-zod`.
> In v5, configs use `legacy: true` and `collisionDetection: false` to approximate v4 behaviour.
> Comparison configs: `tests/e2e/kubb-compare.config.js` in both repos.
> `diff <v5-file> <v4-file>` — `<` = v5, `>` = v4.
>
> Schemas tested: `allOf`, `anyOf`, `discriminator`, `enums`, `jokesOne`, `nullable`, `optionalParameters`, `petStore`, `petStoreContent`, `petStoreResponses`, `readme.io`, `requestBody`, `train-travel`, `worldtime`, `zalando`, `dataset_api`.

---

## Summary Table — E2E Schemas

| Schema | Files differ | Primary Issues |
|--------|:-----------:|----------------|
| `allOf` | 0 | ✅ |
| `anyOf` | 0 | ✅ |
| `discriminator` | ~14 | **@type** intentional (see below) |
| `enums` | ~9 | **E6** enum prefix missing, **@type** intentional |
| `jokesOne` | ~13 | **@type** intentional |
| `nullable` | ~1 | **@type** intentional |
| `optionalParameters` | 0 | ✅ |
| `petStore` | ~18 | **@type** intentional, **v5-better** Errors type |
| `petStoreContent` | ~18 | **@type** intentional |
| `petStoreResponses` | 0 | ✅ |
| `readme.io` | ~4 | **@type** intentional |
| `requestBody` | ~1 | **@type** intentional |
| `train-travel` | ~16 | **@type** intentional, **N-Desc** |
| `worldtime` | ~12 | **@type** intentional, **v5-better** Errors type |
| `zalando` | ~25 | **@type** intentional, **E6** enum prefix |
| `dataset_api` | 0 | ✅ |

---

## Summary Table — Examples

| Example | Config location | Files differ | Notes |
|---------|----------------|:------------:|-------|
| `typescript` | `kubb.config.ts` | ~16 | **@type** intentional |
| `simple-single` | `kubb.config.js` | 1 | **@type** intentional |
| `fetch` | `kubb.config.ts` | 1 | **@type** intentional |
| `faker` | `kubb.config.cjs` | ~20 | **@type** intentional |
| `msw` | `kubb.config.js` | ~20 | **@type** intentional |
| `zod` | `kubb.config.js` | ~28 | **@type** intentional, **N1-ZodTypeName** enum name infix |
| `react-query` | `kubb.config.ts` | ~31 | **@type** intentional |
| `svelte-query` | `kubb.config.js` | ~31 | **@type** intentional |
| `solid-query` | `kubb.config.js` | ~20 | **@type** intentional |
| `swr` | `kubb.config.js` | ~40 | **@type** intentional |
| `cypress` | `kubb.config.js` | ~20 | **@type** intentional |
| `mcp` | `kubb.config.ts` | ~22 | **@type** intentional, **N-Path** (expected — machine path) |
| `client` | `kubb.config.ts` | ~94 | **@type** intentional |
| `advanced` | `configs/kubb.config.ts` | ~27 | **@type** intentional, **E6** enum prefix, **N-Path** |
| `generators` | `kubb.config.ts` | 1 | **G-API** generator API changes (breaking) |
| `vue-query` | `kubb.config.js` | ~20 | **@type** intentional |

> Note: Examples directories contain previously generated output; some may be stale. Regenerate with `pnpm generate` to get current state.

---

## Issue Registry

| ID | Severity | Status | Affects | Description |
|----|----------|--------|---------|-------------|
| T1 | Medium | ✅ Fixed | plugin-ts | `@example` JSDoc emitted in v5, suppressed in v4 |
| T2 | 🔴 High | ✅ By design | plugin-ts (all) | `@type` JSDoc annotation dropped in v5 |
| T3 | Low | ✅ Fixed | plugin-ts | Extra `XxxEnumKey` alias in v5 |
| T4 | Low | ✅ Fixed | plugin-ts | `(string & {})` open union instead of `string` |
| T5 | 🟠 Medium | ✅ By design | plugin-ts (most) | `@type object` / format suffix not emitted in v5 |
| T6 | Low | ✅ Fixed | plugin-ts | `MutationResponse` placement in grouped type |
| T7 | Low | ✅ Fixed | plugin-ts | `@description` on response alias type |
| N-AggType | 🟠 Medium | ✅ Fixed | plugin-ts | `export interface Xxx` instead of `export type Xxx = {` |
| N-QueryParams | 🟠 Medium | ✅ Fixed | plugin-ts | `QueryParams` missing from aggregated operation type |
| N1-ZodTypeName | 🟠 Medium | ❌ Open | plugin-zod, plugin-ts | Extra `Type` infix in zod-generated enum names |
| N-Path | Low | ⚠️ Expected | plugin-mcp | Absolute machine path in `.mcp.json` |
| E1 | 🔴 High | ✅ Fixed | plugin-ts | Path param `$ref` typed as `any` instead of named type |
| E2 | 🟠 Medium | ✅ Fixed | plugin-ts | Discriminant not embedded in union members |
| E3 | 🟠 Medium | ✅ Fixed | plugin-ts | `const` discriminator values → enum+key type instead of literal |
| E5 | 🟡 Low | ✅ Fixed | plugin-ts | `null \| null` duplicated from `null` const |
| E6 | 🟠 Medium | ❌ Open | plugin-ts | Inline enum names missing parent schema prefix |
| N-Desc | 🟡 Low | ❌ Open | plugin-ts | Property-level `@description` missing in v5 |
| N-DescText | 🟡 Low | ❌ Open | plugin-ts | Response description reads from different source than v4 |
| G-API | ⚠️ Breaking | ℹ️ By design | custom generators | Generator context API changed (`plugin.name` → `plugin.key`, `pluginManager` → `driver`) |
| v5-better | 🟢 Improvement | ℹ️ v5 wins | plugin-ts | v5 resolves `Errors` type correctly; v4 uses `any` |

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
- The OAS `format` field (`int64`, `uuid`, etc.) belongs in the spec, not in generated TypeScript.
- `SchemaNodeBase` in `@kubb/ast` does not carry a `format` field — by design.
- `buildPropertyJSDocComments()` in `packages/plugin-ts/src/printer.ts` no longer emits `@type`.

All diffs that consist solely of `@type` lines (and their enclosing `/** */` when otherwise empty) are **expected and intentional**.

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
**Fix**: Confirmed fixed in current gen-compare output.

### N-QueryParams — Missing `QueryParams` in aggregated type ✅ Fixed
Operations with query params were missing `QueryParams: XxxQueryParams` in the v5 aggregated type.
**Fix**: Confirmed fixed in current gen-compare output (e.g. `FindPetsByStatus.ts` now matches).

### E1 — Path param `$ref` schema types as `any` ✅ Fixed
Path parameters using `schema: { $ref: '...' }` were typed as `any` instead of their named type.
**Fix**: `parseParameter()` in `packages/adapter-oas/src/parser.ts` now uses `convertSchema` for `$ref` parameters instead of falling back to `unknownType`.

### E2 — Discriminant not embedded in union members ✅ Fixed
v5 was generating plain unions (`Cat | Dog`) without intersecting each member with its discriminator value.
**Fix**: Added `isLegacyNaming && isDiscriminator(schema)` branch in `convertUnion()` and discriminant embedding in `convertAllOf()` in `packages/adapter-oas/src/parser.ts`.

### E3 — `const` discriminator values → enum type ✅ Fixed
v5 was treating `const` properties as named enums with an `as const` export; v4 emitted inline literals.
**Fix**: Added `fromConst: true` flag to `EnumSchemaNode`. In legacy mode, `fromConst` enums emit as inline literals and are excluded from enum collection and naming.

### E5 — `null | null` duplicated null type ✅ Fixed
`const: null` schemas were generating `null | null`.
**Fix**: Removed `nullable` from the null-const case in `convertConst()`; fixed `convertObject()` to skip nullable for already-null property types.

---

## Open Issues (detail)

### E6 — Inline enum names missing parent schema prefix 🟠 MEDIUM
**Scope**: `zalando`, `advanced` schemas.

v5:
```ts
export const ageGroupsEnum = { ... } as const;
export type AgeGroupsEnumKey = ...;
// used as:
ageGroups: AgeGroupsEnumKey[];
```
v4:
```ts
export const articleAgeGroupsEnum = { ... } as const;
export type ArticleAgeGroupsEnumKey = ...;
// used as:
ageGroups: ArticleAgeGroupsEnumKey[];
```

**Root cause**: v5 names inline property enums by their property name alone; v4 prefixed the parent schema name. With `collisionDetection: false`, two schemas with the same property name share the same enum name.

---

### N1-ZodTypeName — Extra `Type` infix in zod-derived enum names 🟠 MEDIUM
**Scope**: `zod` example, any schema with header/query params + zod plugin.

v5:
```ts
export const createPetsHeaderParamsTypeXEXAMPLEEnum = { ... }
export type CreatePetsHeaderParamsTypeXEXAMPLEEnumTypeKey = ...
```
v4:
```ts
export const createPetsHeaderParamsXEXAMPLEEnum = { ... }
export type CreatePetsHeaderParamsXEXAMPLEEnumTypeKey = ...
```

The word `Type` is inserted between the operation name and the field name in v5's enum naming.

---

### N-Desc — Property-level `@description` missing 🟡 LOW
**Scope**: `enums`, `train-travel` schemas (and likely others with property descriptions in OpenAPI).

v4 emits `@description` for individual properties that have a description in the OpenAPI spec:
```ts
/**
 * @description The type of zoning district.
 */
type?: string;
```
v5 omits the `@description` for property-level descriptions.

---

### N-DescText — Response description reads from different source 🟡 LOW
**Scope**: `worldtime` schema (and potentially others).

```diff
- * @description a list of available timezones         ← v5 (operation description)
+ * @description the list of available timezones in JSON format  ← v4 (response description)
```

v5 picks the description text from `operation.description` while v4 reads from the specific response description (`responses['4xx'].description`).

---

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

### v5 Improvements Over v4 🟢 (better but different)

In several schemas, v5 correctly resolves error response types where v4 had `Errors: any`:

| Schema | v5 | v4 |
|--------|----|----|
| `worldtime` GetTimezone | `Errors: GetTimezoneError` | `Errors: any` |
| `worldtime` GetIp | `Errors: GetIpError` | `Errors: any` |
| `petStore` LogoutUser | `Errors: LogoutUserError` | `Errors: any` |
| `simple-single` CreateUser | `Errors: CreateUserError` | `Errors: any` |
| `simple-single` LogoutUser | `Errors: LogoutUserError` | `Errors: any` |
| `zod` CreatePets | `Errors: CreatePetsErrorType` | `Errors: any` |

These are genuine v5 improvements — error handling types are more precise. They remain as differences from v4 behaviour.
