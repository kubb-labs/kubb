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
| `allOf` | 3 | **E1** path param `$ref` → `any`, **T2** format suffix |
| `anyOf` | 3 | **E1** path param `$ref` → `any`, **T2** format suffix |
| `discriminator` | 12 | **E2** union discriminants stripped, **E3** const→enum, **E5** `null\|null`, **T2** |
| `enums` | 9 | **E6** enum prefix missing, **N-Desc** property descriptions, **T2** |
| `jokesOne` | 13 | **T2** format suffix, **T5** `@type object` inconsistency |
| `nullable` | 1 | **T2** format suffix |
| `optionalParameters` | 1 | **T2** format suffix |
| `petStore` | 18 | **T2** format suffix, **T5** `@type object` inconsistency, **v5-better** Errors type |
| `petStoreContent` | 18 | **T2** format suffix, **T5** `@type object` inconsistency |
| `petStoreResponses` | 3 | **T2** format suffix, **N-Desc** response description |
| `readme.io` | 4 | **T2** format suffix (`binary`) |
| `requestBody` | 1 | **T2** format suffix |
| `train-travel` | 16 | **T2** format suffix, **T5** `@type object` inconsistency, **N-Desc** |
| `worldtime` | 12 | **T2** format suffix, **N-DescText** description text mismatch, **v5-better** Errors type |
| `zalando` | 25 | **T2** format suffix, **E6** enum prefix, **@minLength** inconsistency |
| `dataset_api` | 6 | **T2** format suffix (`uuid`) |

---

## Summary Table — Examples

| Example | Config location | Files differ | Notes |
|---------|----------------|:------------:|-------|
| `typescript` | `kubb.config.ts` | ~16 | **T2**, **N-AggType** (stale output — fix confirmed in gen-compare) |
| `simple-single` | `kubb.config.js` | 1 | **T2** only |
| `fetch` | `kubb.config.ts` | 1 | **T2** only |
| `faker` | `kubb.config.cjs` | ~20 | **T2**, **T5** |
| `msw` | `kubb.config.js` | ~20 | **T2**, **T5** |
| `zod` | `kubb.config.js` | ~28 | **T2**, **N1-ZodTypeName** enum name infix |
| `react-query` | `kubb.config.ts` | ~31 | **T2**, **T5** |
| `svelte-query` | `kubb.config.js` | ~31 | **T2**, **T5** |
| `solid-query` | `kubb.config.js` | ~20 | **T2**, **T5** |
| `swr` | `kubb.config.js` | ~40 | **T2**, **T5** |
| `cypress` | `kubb.config.js` | ~20 | **T2**, **T5** |
| `mcp` | `kubb.config.ts` | ~22 | **T2**, **T5**, **N-Path** (expected — machine path) |
| `client` | `kubb.config.ts` | ~94 | **T2**, **T5** |
| `advanced` | `configs/kubb.config.ts` | ~27 | **T2**, **T5**, **E6** enum prefix, **N-Path** |
| `generators` | `kubb.config.ts` | 1 | **G-API** generator API changes (breaking) |
| `vue-query` | `kubb.config.js` | ~20 | **T2**, **T5** |

> Note: Examples directories contain previously generated output; some may be stale. Regenerate with `pnpm generate` to get current state.

---

## Issue Registry

| ID | Severity | Status | Affects | Description |
|----|----------|--------|---------|-------------|
| T1 | Medium | ✅ Fixed | plugin-ts | `@example` JSDoc emitted in v5, suppressed in v4 |
| T2 | 🔴 High | ❌ Open | plugin-ts (all) | Format suffix missing from `@type` JSDoc |
| T3 | Low | ✅ Fixed | plugin-ts | Extra `XxxEnumKey` alias in v5 |
| T4 | Low | ✅ Fixed | plugin-ts | `(string & {})` open union instead of `string` |
| T5 | 🟠 Medium | ❌ Open | plugin-ts (most) | `@type object\|undefined` inconsistency for refs |
| T6 | Low | ✅ Fixed | plugin-ts | `MutationResponse` placement in grouped type |
| T7 | Low | ✅ Fixed | plugin-ts | `@description` on response alias type |
| N-AggType | 🟠 Medium | ✅ Fixed | plugin-ts | `export interface Xxx` instead of `export type Xxx = {` |
| N-QueryParams | 🟠 Medium | ✅ Fixed | plugin-ts | `QueryParams` missing from aggregated operation type |
| N1-ZodTypeName | 🟠 Medium | ❌ Open | plugin-zod, plugin-ts | Extra `Type` infix in zod-generated enum names |
| N-Path | Low | ⚠️ Expected | plugin-mcp | Absolute machine path in `.mcp.json` |
| E1 | 🔴 High | ❌ Open | plugin-ts | Path param `$ref` typed as `any` instead of named type |
| E2 | 🟠 Medium | ❌ Open | plugin-ts | Discriminant not embedded in union members |
| E3 | 🟠 Medium | ❌ Open | plugin-ts | `const` discriminator values → enum+key type instead of literal |
| E5 | 🟡 Low | ❌ Open | plugin-ts | `null \| null` duplicated from `null` const |
| E6 | 🟠 Medium | ❌ Open | plugin-ts | Inline enum names missing parent schema prefix |
| N-Desc | 🟡 Low | ❌ Open | plugin-ts | Property-level `@description` missing in v5 |
| N-DescText | 🟡 Low | ❌ Open | plugin-ts | Response description reads from different source than v4 |
| G-API | ⚠️ Breaking | ℹ️ By design | custom generators | Generator context API changed (`plugin.name` → `plugin.key`, `pluginManager` → `driver`) |
| v5-better | 🟢 Improvement | ℹ️ v5 wins | plugin-ts | v5 resolves `Errors` type correctly; v4 uses `any` |

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
**Fix**: Confirmed fixed in current gen-compare output. Examples directory may still show stale output.

### N-QueryParams — Missing `QueryParams` in aggregated type ✅ Fixed
Operations with query params were missing `QueryParams: XxxQueryParams` in the v5 aggregated type.
**Fix**: Confirmed fixed in current gen-compare output (e.g. `FindPetsByStatus.ts` now matches).

---

## Open Issues (detail)

### T2 — Format suffix missing in `@type` JSDoc �� HIGH
**Scope**: All schemas (16/16). Every model file with `integer`, `string`, `number` properties.

v5:
```ts
/**
 * @type integer | undefined
 */
petId?: number;
```
v4:
```ts
/**
 * @type integer | undefined, int64
 */
petId?: number;
```

Affected formats: `int32`, `int64`, `date-time`, `uuid`, `binary`, `string` (when explicit), `iri-reference`, `uri`, etc.

**Root cause**: `SchemaNodeBase` in `@kubb/ast` has no `oasFormat` field. `buildPropertyJSDocComments()` in `printer.ts` cannot emit the format.

**Fix path**:
1. Add `oasFormat?: string` to `SchemaNodeBase` in `packages/ast/src/nodes/schema.ts`
2. Populate `oasFormat` from `schema.format` in `packages/adapter-oas/src/parser.ts`
3. In `buildPropertyJSDocComments()` in `printer.ts`, append `, ${oasFormat}` when `legacy && oasFormat`

---

### T5 — `@type object | undefined` inconsistency 🟠 MEDIUM
**Scope**: Most schemas. Behaviour differs from v4.

- v5 emits `@type object | undefined` for **inline** anonymous object properties (not present in v4)
- v5 does **not** emit `@type object | undefined` for `$ref`-backed object properties (v4 does)

v5 (extra — inline object gets @type):
```ts
export type JokeResponse = {
  /**
   * @type object | undefined  ← v5 adds this, v4 doesn't
   */
  contents?: { jokes?: Joke[] };
};
```

v4 (for $ref property — v4 adds @type, v5 doesn't):
```ts
export type AddPetRequest = {
  /**
   * @type object | undefined  ← v4 has this, v5 doesn't
   */
  address?: Address;
};
```

**Root cause**: v4 dereferenced `$ref`s and emitted `@type object` for resolved objects. v5 `RefSchemaNode` has `type: 'ref'` — `buildPropertyJSDocComments()` has no case for refs.

**Fix path**: In `buildPropertyJSDocComments()` in `printer.ts`:
- When `legacy && schema.type === 'ref'`: emit `@type object${optional ? ' | undefined' : ''}`
- Remove emission of `@type object | undefined` for inline object types when `legacy` (to avoid adding extra JSDoc that v4 didn't have)

---

### E1 — Path param / `$ref` schema types as `any` 🔴 HIGH
**Scope**: `allOf`, `anyOf` schemas.

v5:
```ts
// Missing import
export type CreateTest = {
  test_id: any;  // ← should be TestId
};
```
v4:
```ts
import type { TestId } from "./TestId.ts";
export type CreateTest = {
  /**
   * @type string, uuid
   */
  test_id: TestId;
};
```

**Root cause**: Path parameters using `schema: { $ref: '...' }` are not resolved to their TypeScript type in v5's operation type generator. The type becomes `any` instead of the referenced schema type.

---

### E2 — Discriminant not embedded in union members 🟠 MEDIUM
**Scope**: `discriminator` schema.

v5:
```ts
export type CatDog = Cat | Dog;
```
v4:
```ts
export type CatDog =
  | (Cat & { type: "Cat" })
  | (Dog & { type: "Dog" });
```

**Root cause**: v5 generates a plain union without intersecting each member with its discriminator value. v4 embeds the literal discriminant value in each union member.

---

### E3 — `const` discriminator values → enum type 🟠 MEDIUM
**Scope**: `discriminator` schema.

v5:
```ts
export const catTypeEnum = { Cat: "Cat" } as const;
export type CatTypeEnumKey = (typeof catTypeEnum)[keyof typeof catTypeEnum];

export type Cat = {
  type: CatTypeEnumKey;  // ← should be literal "Cat"
};
```
v4:
```ts
export type Cat = {
  type: "Cat";
};
```

**Root cause**: v5 treats `const` properties as enum schemas and generates a full `asConst` enum for them. v4 emitted the literal value directly.

---

### E5 — `null | null` duplicated null type 🟡 LOW
**Scope**: `discriminator` schema, `NullConst.ts`.

v5:
```ts
withoutValue: null | null;
```
v4:
```ts
withoutValue: null;
```

**Root cause**: A `null` const schema generates the `null` keyword AND a separate null literal union member.

---

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

**Root cause**: v5 names inline property enums by their property name alone; v4 prefixed the parent schema name. With `collisionDetection: false`, this worsens as two schemas with same property name share the same enum name.

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
 * @type string
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

### @minLength inconsistency 🟡 LOW
**Scope**: `zalando` emits extra `@minLength 0` / `@minLength 1` in v5 that v4 doesn't have; conversely `optionalParameters` v4 has `@minLength 1` that v5 doesn't.

Inconsistent handling depending on whether the constraint is at the property level vs. the schema level, or inline vs. `$ref`.

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

---

## Priority Fix Order

| Priority | Issue | Est. Impact |
|----------|-------|-------------|
| 1 | **T2** — format suffix | All 16 schemas, most files |
| 2 | **E1** — path param `$ref` → `any` | allOf, anyOf |
| 3 | **T5** — `@type object` inconsistency | Most schemas |
| 4 | **E2** — discriminant not in union | discriminator |
| 5 | **E3** — const → enum | discriminator |
| 6 | **N1-ZodTypeName** — `Type` infix | zod example |
| 7 | **E6** — enum prefix missing | zalando, advanced |
| 8 | **E5** — `null \| null` | discriminator |
| 9 | **N-Desc** — property `@description` | enums, train-travel |
| 10 | **N-DescText** — description source | worldtime |
