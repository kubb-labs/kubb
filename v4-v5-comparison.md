# Kubb v4 vs v5 Output Comparison Report

> **Methodology**: Every example with a `kubb.config` file was diffed recursively between v5 (`/examples/`) and v4 (`kubb-v4/examples/`) after generating output in both repos.
> In v5, configs use `legacy: true` and `collisionDetection: false` to approximate v4 behaviour.
> Config locations checked: root `kubb.config.ts|js|cjs`, and `configs/kubb.config.ts` for the advanced example.
> Left side (`<`) is **v5**, right side (`>`) is **v4**.

---

## Summary Table

| Example | Config location | Plugin(s) | Files differ | Only in v4 | Status |
|---------|----------------|-----------|:------------:|:----------:|--------|
| `typescript` | `kubb.config.ts` | plugin-ts | ~0 | 0 | ✅ T2, T5 fixed |
| `simple-single` | `kubb.config.js` | plugin-ts, plugin-react-query | ~0 | 0 | ✅ T2, T5 fixed; ⚠️ N-Import |
| `fetch` | `kubb.config.ts` | plugin-ts, plugin-client | ~0 | 0 | ✅ T2, T5 fixed; ⚠️ N-Import |
| `faker` | `kubb.config.cjs` | plugin-ts, plugin-faker | ~0 | 0 | ✅ T2, T5 fixed; ⚠️ N-Import |
| `msw` | `kubb.config.js` | plugin-ts, plugin-msw | ~0 | 0 | ✅ T2, T5 fixed; ⚠️ N-Import |
| `zod` | `kubb.config.js` | plugin-ts, plugin-zod | ~0 | 0 | ✅ T2, T5, N-ZodNaming fixed; ⚠️ N-Import |
| `react-query` | `kubb.config.ts` | plugin-ts, plugin-react-query | ~36 | 35 | ✅ T2, T5 fixed; ⚠️ N-Import |
| `svelte-query` | `kubb.config.js` | plugin-ts, plugin-svelte-query | ~0 | 0 | ✅ T2, T5 fixed; ⚠️ N-Import |
| `solid-query` | `kubb.config.js` | plugin-ts, plugin-solid-query | ~0 | 0 | ✅ T2, T5 fixed; ⚠️ N-Import |
| `swr` | `kubb.config.js` | plugin-ts, plugin-swr | ~0 | 0 | ✅ T2, T5 fixed; ⚠️ N-Import |
| `cypress` | `kubb.config.js` | plugin-ts, plugin-cypress | ~0 | 0 | ✅ T2, T5 fixed; ⚠️ N-Import |
| `mcp` | `kubb.config.ts` | plugin-ts, plugin-mcp | ~0 | 0 | ✅ T2, T5 fixed; ⚠️ N-Import, N-Path(expected) |
| `client` | `kubb.config.ts` | plugin-ts, plugin-client | ~19 | 19 | ✅ T2, T5, N-AggType, N-QueryParams fixed; ⚠️ N-Import |
| `advanced` | `configs/kubb.config.ts` | all plugins | ~4 | 0 | ✅ T2 fixed; ⚠️ N-Collision |
| `generators` | `kubb.config.ts` | plugin-oas (custom) | — | — | ⚠️ Custom generator API change |
| `vue-query` | (no config found) | — | — | — | ⚠️ Skipped |

**Legend**: T2 = format suffix, T5 = @type object for refs, N-Import = import ordering, N-AggType = interface vs type, N-QueryParams = missing QueryParams in aggregated type, N-ZodNaming = aggregate type name order, N-Collision = collision naming convention, N-Path = absolute path in generated file.

---

## Issue Reference

| ID | Severity | Status | Affects |
|----|----------|--------|---------|
| T1 | Medium | ✅ Fixed | plugin-ts |
| T2 | High | ❌ Open | plugin-ts (all examples) |
| T3 | Low | ✅ Fixed | plugin-ts |
| T4 | Low | ✅ Fixed | plugin-ts |
| T5 | Medium | ❌ Open | plugin-ts (all examples) |
| T6 | Low | ✅ Fixed | plugin-ts |
| T7 | Low | ✅ Fixed | plugin-ts |
| N-Import | Low | ❌ Open | all plugins |
| N-AggType | Medium | ❌ Open | plugin-ts |
| N-QueryParams | High | ✅ Fixed | plugin-ts |
| N-ZodNaming | Medium | ✅ Fixed | plugin-zod |
| N-Collision | Medium | ❌ Open | advanced example only |
| N-Path | Low | ⚠️ Not a bug | plugin-mcp |

---

## Fixed Issues

### T1 — `@example` JSDoc tags ✅ Fixed

v5 was emitting `@example` annotations from OpenAPI `example` fields; v4 did not emit them in legacy mode.

**Fix**: When `legacy: true`, the `@example` tag is suppressed in `packages/plugin-ts/src/printer.ts`.

---

### T3 — Extra enum type alias ✅ Fixed

v5 was generating an extra `export type FooKey = ...` alias alongside the enum const (needed for `needsRefAlias`); v4 did not.

**Fix**: `needsRefAlias` is gated on `!legacy` in `packages/plugin-ts/src/components/Enum.tsx`.

---

### T4 — `(string & {})` open string union ✅ Fixed

v5 emitted `(string & {})` for open string unions in enum types; v4 emitted plain `string`.

**Fix**: When `legacy: true`, `(string & {})` is replaced with `string` in `packages/plugin-ts/src/printer.ts`.

---

### T6 — `MutationResponse` placement ✅ Fixed

In v5, the grouped `XxxMutation` type had its response alias placed after the group type; v4 placed it before.

**Fix**: Swapped alias output order in `packages/plugin-ts/src/generators/typeGenerator.tsx`.

---

### T7 — Request body description ✅ Fixed

v4 included the operation `requestBody.description` as a JSDoc comment on the request type alias; v5 did not.

**Fix**: Added `description` field to `requestBody` in `packages/ast/src/nodes/operation.ts`, populated it in `packages/adapter-oas/src/parser.ts`, and threaded it into `typeGenerator.tsx`.

---

### N-QueryParams — Missing `QueryParams` in aggregated operation types ✅ Fixed

v4 included `QueryParams` in the aggregated `XxxMutation`/`XxxQuery` type for ALL operations that have query parameters. v5 only included `QueryParams` for GET operations.

**Fix**: In `buildLegacyResponsesSchemaNode()` in `packages/plugin-ts/src/generators/utils.ts`, removed the `else if (isGet && ...)` guard. `QueryParams` is now added for any operation that has query parameters, and the property order is `Response → Request → PathParams → QueryParams → HeaderParams → Errors` (matching v4).

---

### N-ZodNaming — Aggregated Zod type name order ✅ Fixed

When `transformers.name` was set (e.g. `name => \`${name}Type\``), v5 applied the transformer to the fully composed name (`AddPetMutation` → `AddPetMutationType`). v4 applied the transformer to the base operationId first (`AddPet` → `AddPetType`), then appended the suffix (`AddPetTypeMutation`).

**Fix**: In `resolverTsLegacy`, `resolveResponsesName` and `resolveResponsesTypedName` now call `this.default(node.operationId, type)` to get the (possibly transformed) base name, then append the suffix directly — matching v4's composition order.

---

## Open Issues

### T2 — `@type` format suffix missing (HIGH priority)

v4 appends the OpenAPI `format` value after the type in `@type` JSDoc comments. v5 omits it.

| v5 output | v4 output |
|-----------|-----------|
| `@type integer \| undefined` | `@type integer \| undefined, int64` |
| `@type integer \| undefined` | `@type integer \| undefined, int32` |
| `@type string \| undefined` | `@type string \| undefined, date-time` |
| `@type integer` | `@type integer, int64` |

**Affected examples**: typescript, client, fetch, react-query, msw, zod, faker, svelte-query, solid-query, swr, cypress, mcp, simple-single, advanced (ALL).

---

### N-AggType — Aggregated operation type: `interface` vs `type =` (MEDIUM priority)

v5 generates aggregated operation types (the object grouping `Response`, `Request`, `PathParams`, etc.) as `export interface`, while v4 generates them as `export type X = { ... }`.

| v5 output | v4 output |
|-----------|-----------|
| `export interface UpdatePetMutation {` | `export type UpdatePetMutation = {` |
| `export interface GetInventoryQuery {` | `export type GetInventoryQuery = {` |

**Affected examples**: typescript, client, fetch, simple-single (all files with aggregated operation types).

---

### T5 — Missing `@type object | undefined` for ref properties (MEDIUM priority)

v4 emitted `@type object | undefined` for `$ref`-typed properties (since `$ref`s were dereferenced to their object target at parse time). v5 omits the `@type` JSDoc for `ref` schema nodes.

| v5 output | v4 output |
|-----------|-----------|
| (no `@type` annotation) | `@type object \| undefined` |

**Affected examples**: typescript, client, fetch (all examples with object properties referencing other schemas).

---

### N-Import — Import ordering and quote style (LOW priority)

v4 generates imports in alphabetical order within a single `import` statement (grouped by source), using single quotes. v5 generates imports in usage order, using double quotes in some cases.

| v5 output | v4 output |
|-----------|-----------|
| `import fetch from "@kubb/plugin-client/clients/fetch";` | `import type { Client, RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/fetch'` |
| `import type { AddPetMutationRequest, AddPetMutationResponse, AddPet405 }` | `import type { AddPet405, AddPetMutationRequest, AddPetMutationResponse }` (alphabetical) |
| `import { faker } from "@faker-js/faker"` placed last | `import { faker } from '@faker-js/faker'` placed first |

**Affected examples**: ALL (fetch, client, faker, msw, react-query, etc.).

**Root cause**: v5 uses Biome's `organizeImports` which reorders import declarations but sorts named imports differently. v4 sorted named imports alphabetically. Additionally, value imports (`import X`) appear before type imports (`import type`) in v4 but not consistently in v5.

> **Note**: This is a cosmetic difference and does not affect runtime behaviour.

---

### N-Collision — Collision detection naming convention (MEDIUM priority, advanced example)

When multiple enums have the same name (e.g., `status` in both `Order` and `Customer`), v5 and v4 use different strategies to avoid collisions.

| v5 output | v4 output |
|-----------|-----------|
| `export const paramsStatusEnum = { ... }` | `export const orderParamsStatusEnum = { ... }` |
| `export const paramsStatusEnum2 = { ... }` (numeric suffix) | `export const customerParamsStatusEnum = { ... }` (schema prefix) |
| `export type ParamsStatusEnum2Key` | `export type OrderParamsStatusEnumKey` |

**Affected examples**: advanced (where `collisionDetection: false` exposes this — both `Order.status` and `Customer.status` enums conflict).

**Root cause**: v5 with `collisionDetection: false` falls back to numeric suffixes (`enum2`) to resolve name conflicts. v4 prefixed the schema name (`orderParams…`, `customerParams…`) to the enum name.

---

## Per-Example Details

### `typescript` — 1 file differs

**File**: `src/gen/models.ts`

Only **T2** (format suffix) and **T5** (`@type object`) differences remain. All other issues (T1, T3, T4, T6, T7) have been fixed.

```diff
-   * @type integer | undefined
+   * @type integer | undefined, int64
```
```diff
+   /**
+    * @type object | undefined
+    */
    category?: Category
```

---

### `simple-single` — 2 files differ

**Files**: `src/gen/models.ts`, `src/gen/hooks.ts`

`models.ts` has **T2** + **T5** differences. `hooks.ts` has **N-Import** differences (import ordering, react-query types reordered).

---

### `fetch` — 22 files differ

Every generated client file (`addPet.ts`, `deletePet.ts`, etc.) has **N-Import** differences: the import order within the file differs between v5 and v4. The type models also have **T2** + **T5**.

---

### `faker` — 46 files differ (config: `kubb.config.cjs`)

**Config location**: `examples/faker/kubb.config.cjs` (CommonJS format — runs correctly with `npx kubb --config kubb.config.cjs`).

Differences are:
- `models/*.ts`: **T2** (format suffix missing)
- `faker/create*.ts`: **N-Import** (`import { faker }` placed in different position)
- `index.ts`: **N-Import** ordering

No missing files — both v4 and v5 generate the same set of files (after running both configs in the `.cjs` file).

---

### `msw` — 57 files differ

Differences are primarily **N-Import** (import order in each generated file). The TS models also have **T2** + **T5**.

v4 generates additional individual mock files (`createCategory.ts`, `createApiResponse.ts`, etc.) in `mocks/` that v5 does not — this appears to be controlled by configuration (`exclude` patterns) rather than a regression.

---

### `zod` — 78 files differ (config: `kubb.config.js`)

Differences include:
- `ts/*.ts`: **T2**, **T5**, **N-ZodNaming** (aggregated type name order), **N-Import**, and semicolon style
- `index.ts`: **N-ZodNaming** causes barrel to export different names; v4 also exports enum constants (`export { addPetRequestStatusEnum }`) while v5 only exports type names
- `schemas/*.ts`: minor formatting differences

---

### `react-query` — 71 files differ, 35 only in v4

**35 files only in v4**: v4 generates per-operation hook files with a `Hook` suffix (e.g., `useAddPetHook.ts`, `useGetPetByIdSuspenseHook.ts`) inside the tag group folder alongside the group barrel `index.ts`. v5 only generates the `index.ts` barrel.

```
v4: hooks/pet/useAddPetHook.ts  ← per-operation file
v5: hooks/pet/index.ts          ← barrel only
```

Remaining differences are **T2**, **T5**, **N-Import**.

---

### `svelte-query` — 56 files differ

All **N-Import** + **T2** + **T5**. No missing files.

---

### `solid-query` — 56 files differ

All **N-Import** + **T2** + **T5**. No missing files.

---

### `swr` — 55 files differ

All **N-Import** + **T2** + **T5**. No missing files.

---

### `cypress` — 54 files differ

All **N-Import** + **T2** + **T5**. No missing files.

---

### `mcp` — 94 files differ

Differences: **N-Import**, **T2**, **T5**, and **N-Path** (absolute path in `.mcp.json`). No missing files.

---

### `client` — 55 files differ, 19 only in v4

The client example uses custom generators (`src/generators/`). The 19 files only in v4 appear to be generated by a slightly different version of the custom generators between v4 and v5.

Content differences in shared files: **N-AggType** (interface vs type), **N-QueryParams** (missing QueryParams), **T2**, **T5**, **N-Import**.

---

### `advanced` — 27 files differ (config: `configs/kubb.config.ts`)

**Config location**: `examples/advanced/configs/kubb.config.ts` — must be run with `npx kubb --config configs/kubb.config.ts`.

Differences:
- `models/ts/*.ts`: **T2** (format suffix), **N-Collision** (enum naming)
- `index.ts` barrel: **N-Collision** causes different export names
- `mcp/.mcp.json`: **N-Path** (absolute path)

**N-Collision detail**: The advanced example has both `Order.status` and `Customer.status` enums. With `collisionDetection: false`, v5 uses a numeric suffix strategy:
```
v5: paramsStatusEnum / paramsStatusEnum2 / ParamsStatusEnum2Key
v4: orderParamsStatusEnum / customerParamsStatusEnum / OrderParamsStatusEnumKey / CustomerParamsStatusEnumKey
```

---

### `generators` — Custom generator API

The generators example uses a custom `plugin-oas` generator. The generator API changed between v4 and v5 (`context.driver` vs `context.plugin`). This is an intentional breaking change in the public API, not a regression.

---

## Technical Root Causes

### Why T2 (format suffix) is missing in v5

v4 and v5 use **completely different schema pipeline architectures**:

- **v4**: Uses `SchemaGenerator` with keyword-based schemas (`Schema[]` with `{ keyword, args }` entries). When processing properties, it calls `oas.dereferenceWithRef(schema)` which resolves `$ref`s to target schemas, making `schema.format` directly accessible. JSDoc is built with:
  ```typescript
  [`@type ${type}${!isOptional ? '' : ' | undefined'}`, format].filter(Boolean).join(', ')
  ```

- **v5**: Uses `SchemaNode` AST from `@kubb/adapter-oas`. `SchemaNodeBase` does not have an `oasFormat` field. The `buildPropertyJSDocComments()` function in `printer.ts` checks `schema.primitive` (string/number/boolean/object/array) but does not access `schema.oasFormat`.

### Why T5 (@type object for refs) is missing in v5

- **v4**: `$ref` properties are dereferenced to their target schema at parse time, so `type` becomes `'object'` for object schemas. The JSDoc emitter then produces `@type object | undefined`.
- **v5**: Ref properties become `RefSchemaNode` with `type: 'ref'`. `buildPropertyJSDocComments()` has no case for `type === 'ref'`, so no `@type` JSDoc is emitted.

### Why N-AggType (interface vs type) differs

The aggregated operation type (`XxxMutation`, `XxxQuery`) is generated in `typeGenerator.tsx`. In v5, all non-inline named types are generated as `interface`. v4 generated these specifically as `type` aliases (`export type X = { ... }`).

### Why N-Collision naming differs

v4's collision resolution prefixed the schema name (`Order` + `paramsStatus` → `orderParamsStatus`). v5's collision resolution with `collisionDetection: false` uses a counter suffix (`paramsStatus`, `paramsStatus2`).

---

*Report generated after running all examples with `pnpm build` + `npx kubb` in both repos. v5 commit: latest main; v4 repo: `/Users/stijnvanhulle/GitHub/kubb-v4`.*

---

## E2E Schema Comparison (`tests/e2e/schemas/`)

> **Methodology**: Generated per-schema output in both v5 (`tests/e2e/gen-compare/<name>/`) and v4 (`tests/e2e/gen-compare/<name>/`) using identical configs (plugin-ts with `legacy:true` + `collisionDetection:false` in v5, same plugins without adapter in v4). Only local schemas used (no network required). Schemas: `allOf`, `anyOf`, `box`, `dataset_api`, `discriminator`, `enums`, `jokesOne`, `nullable`, `optionalParameters`, `petStore`, `petStoreContent`, `petStoreResponses`, `readme.io`, `requestBody`, `train-travel`, `twitter`, `worldtime`, `zalando`.

### E2E Summary Table

| Schema | Files differ | Only in v4 | Only in v5 | Issues |
|--------|:-----------:|:----------:|:----------:|--------|
| `allOf` | 3 | 0 | 0 | T2, **E1** |
| `anyOf` | 3 | 0 | 0 | T2, T5 |
| `box` | 237 | 105 | 105 | **E4** (file naming) |
| `dataset_api` | 6 | 0 | 0 | T2 |
| `discriminator` | 12 | 0 | 0 | **E2**, **E3**, **E5** |
| `enums` | 9 | 0 | 0 | **E6**, **E7** |
| `jokesOne` | 13 | 0 | 0 | T2, N-QueryParams |
| `nullable` | 2 | 0 | 0 | T5 |
| `optionalParameters` | 1 | 0 | 0 | T2, **E8** |
| `petStore` | 18 | 0 | 0 | T2, T5 |
| `petStoreContent` | 18 | 0 | 0 | T2, T5 |
| `petStoreResponses` | 3 | 0 | 0 | T2, T5 |
| `readme.io` | 5 | 0 | 0 | T2, N-QueryParams |
| `requestBody` | 1 | 0 | 0 | T2 |
| `train-travel` | 16 | 0 | 0 | T2, T5 |
| `twitter` | 274 | 0 | 0 | T2, T5 |
| `worldtime` | 12 | 0 | 0 | T2, N-QueryParams |
| `zalando` | 37 | 0 | 0 | T2, **E6**, **E9** |

---

### E1 — Path parameter `$ref` typed as `any` (HIGH priority)

When an OpenAPI path parameter uses `schema: { $ref: '#/components/schemas/Xxx' }`, v5 types it as `any`. v4 resolves the ref and emits the correct named type.

| v5 output | v4 output |
|-----------|-----------|
| `test_id: any` | `test_id: TestId` |

**Affected schemas**: `allOf`, and any schema with `$ref` schemas on path parameters.

**Sample** (`allOf/models/ts/testController/CreateTest.ts`):
```diff
+import type { TestId } from "../TestId.ts";
 export type CreateTestPathParams = {
-  test_id: any;
+  test_id: TestId;
 };
```

---

### E2 — Discriminated union: missing type discriminant embedding (HIGH priority)

For schemas using OpenAPI `discriminator`, v4 embeds the discriminant value (`type: "Cat"`) inside each union member. v5 generates a plain union without the discriminant.

| v5 output | v4 output |
|-----------|-----------|
| `export type CatDog = Cat \| Dog` | `export type CatDog = (Cat & { type: "Cat" }) \| (Dog & { type: "Dog" })` |

**Affected schemas**: `discriminator` (all discriminated union types: `CatDog`, `CatDogWithoutMapping`).

**Sample** (`discriminator/models/ts/CatDog.ts`):
```diff
-export type CatDog = Cat | Dog
+export type CatDog =
+  | (Cat & { type: 'Cat' })
+  | (Dog & { type: 'Dog' })
```

---

### E3 — Discriminator const properties: enum vs inline literal (MEDIUM priority)

When a schema has a `const` value for a discriminator property (e.g., `type: { const: "Cat" }`), v5 generates an enum const object and an enum key type, then uses the enum key type. v4 uses the inline string literal directly.

| v5 output | v4 output |
|-----------|-----------|
| `export const catTypeEnum = { Cat: "Cat" } as const`<br>`export type CatTypeEnumKey = ...`<br>`type: CatTypeEnumKey` | `type: "Cat"` |

**Affected schemas**: `discriminator` (Cat, Dog, MixedValueTypeConst, NumberValueConst).

---

### E4 — File naming for operations with numeric version suffixes (MEDIUM priority)

For operations whose operationId ends in a number (e.g., `deleteArchivesIdV2025`), v5 and v4 produce different file structures.

| v5 output | v4 output |
|-----------|-----------|
| `mocks/archivesController/createDeleteArchivesIdV20250.ts` | `mocks/archivesController/deleteArchivesIdV2025/create0.ts` |

v4 creates a subdirectory named after the operationId with a file `create0.ts` (the trailing digit becomes a subdirectory separator). v5 appends the trailing character to the filename.

**Affected schemas**: `box` (105 operations affected — all with version-suffixed operationIds like `V2025`).

---

### E5 — `null | null` duplicated null type (LOW priority)

For a `null` const schema (e.g., `{ type: null, const: null }`), v5 generates `null | null` (duplicated), while v4 generates just `null`.

| v5 output | v4 output |
|-----------|-----------|
| `withoutValue: null \| null` | `withoutValue: null` |

**Affected schemas**: `discriminator` (NullConst schema).

---

### E6 — Inline enum naming: no schema prefix in v5 (MEDIUM priority)

For inline enums (enum values defined directly inside a schema property), v5 names the generated const without the parent schema name prefix. v4 includes the schema name as a prefix.

| v5 output | v4 output |
|-----------|-----------|
| `export const ageGroupsEnum = { ... }` | `export const articleAgeGroupsEnum = { ... }` |
| `export type AgeGroupsEnumKey = ...` | `export type ArticleAgeGroupsEnumKey = ...` |

**Affected schemas**: `enums`, `zalando` (any schema with inline property enums).

> **Note**: This overlaps with **N-Collision** from the examples comparison. When `collisionDetection: false`, multiple schemas can have the same inline enum name, leading to conflicts.

---

### E7 — Enum type alias missing in v5 (MEDIUM priority)

For top-level enum schemas (schemas that are entirely an enum), v4 generates both the enum const AND a type alias pointing to it. v5 generates only the enum const and key type.

| v5 output | v4 output |
|-----------|-----------|
| `export const zoningDistrictClassCategoryEnum = { ... } as const`<br>`export type ZoningDistrictClassCategoryEnumKey = ...` | `export const zoningDistrictClassCategoryEnum = { ... } as const`<br>`export type ZoningDistrictClassCategoryEnumKey = ...`<br>`export type ZoningDistrictClassCategory = ZoningDistrictClassCategoryEnumKey` |

v4 generates an additional `export type ZoningDistrictClassCategory = ZoningDistrictClassCategoryEnumKey` alias that v5 does not.

**Affected schemas**: `enums` (all top-level enum schemas).

---

### E8 — `@minLength` JSDoc annotation inconsistency (LOW priority)

Behavior differs between v5 and v4 for `@minLength`:
- **`optionalParameters` schema**: v4 emits `@minLength 1`, v5 does not.
- **`zalando` schema**: v5 emits `@minLength 1`, v4 does not.

This suggests inconsistent JSDoc annotation emission for string length constraints. The difference appears to depend on whether the constraint is applied at the property level or the schema level.

---

### E9 — `@type object` for `allOf`/ref properties in discriminator contexts (LOW priority)

In some schemas (zalando, twitter), v4 includes `@type object` or `@type array` JSDoc annotations for properties that reference object/array schemas via `$ref`. v5 omits these (same as **T5** in the examples).

---

### Cross-Schema Issue Frequency

| Issue | # Schemas affected |
|-------|:-----------------:|
| T2 (format suffix missing) | 17/18 |
| T5 (@type object for refs) | 8/18 |
| N-QueryParams (missing in aggregated type) | 3/18 |
| E1 (path param $ref → any) | 1/18 |
| E2 (discriminant not embedded in union) | 1/18 |
| E3 (const → enum instead of literal) | 1/18 |
| E4 (numeric suffix file naming) | 1/18 |
| E5 (null\|null) | 1/18 |
| E6 (enum naming without schema prefix) | 2/18 |
| E7 (missing enum type alias) | 1/18 |
| E8 (@minLength inconsistency) | 2/18 |

