# @kubb/adapter-oas

## 5.0.0-alpha.13

### Patch Changes

- [#2857](https://github.com/kubb-labs/kubb/pull/2857) [`0d40bdb`](https://github.com/kubb-labs/kubb/commit/0d40bdb2809c43f60bb52b95d12de28785dc03f0) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Discriminant values are now embedded into each union member when a discriminator mapping is present.

  Previously, a discriminated `oneOf`/`anyOf` union without sibling `properties` would emit a plain union (`Cat | Dog`). Now each mapped member is intersected with its narrowed discriminant literal value, producing `(Cat & { type: 'cat' }) | (Dog & { type: 'dog' })`.

  Child schemas that extend a discriminated parent via `allOf` now also carry the narrowed discriminant literal in their intersection type, even when the parent `$ref` is filtered to prevent circular type references.

- [#2856](https://github.com/kubb-labs/kubb/pull/2856) [`7579443`](https://github.com/kubb-labs/kubb/commit/75794431daa28c1258f334b53ef7e62114a19bd7) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Fixed `null | null` duplication for `const: null` schemas. `convertConst()` no longer propagates the `nullable` flag when the const value is `null`, and `convertObject()` now skips setting `nullable` on properties whose resolved type is already `null`.

- [#2863](https://github.com/kubb-labs/kubb/pull/2863) [`de001b0`](https://github.com/kubb-labs/kubb/commit/de001b0f05acedf160b433878e8868a2e588a44c) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Fix path parameters with `$ref` schemas being typed as `any` instead of their named type.

- [#2858](https://github.com/kubb-labs/kubb/pull/2858) [`975717e`](https://github.com/kubb-labs/kubb/commit/975717e2c8cf8d33f5d9d641be4bb164fd36f423) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Fix missing `@description` on request body type aliases.

  The OAS `requestBody.description` field (top-level on the request body object, distinct from the schema's own description) was silently dropped. It is now:
  - Added as `description?: string` to `OperationNode.requestBody` in `@kubb/ast`
  - Populated by `@kubb/adapter-oas` parser from `operation.schema.requestBody.description`
  - Used by `@kubb/plugin-ts` typeGenerator: `requestBody.description` takes precedence, falling back to `requestBody.schema.description`

- [#2869](https://github.com/kubb-labs/kubb/pull/2869) [`b41a75d`](https://github.com/kubb-labs/kubb/commit/b41a75df4e48e6ae469a4d246f37405e4eb08c0e) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Generate named enum declarations for enum elements inside tuples (`prefixItems`). Previously, enum values in tuple positions were inlined as literal unions. Now they emit standalone `as const` enum exports (e.g., `addressIdentifierEnum` / `AddressIdentifierEnumKey`) matching v4 behavior. Also restores `...any[]` rest element when `items` is absent alongside `prefixItems`.

- Updated dependencies [[`975717e`](https://github.com/kubb-labs/kubb/commit/975717e2c8cf8d33f5d9d641be4bb164fd36f423)]:
  - @kubb/ast@5.0.0-alpha.13
  - @kubb/core@5.0.0-alpha.13

## 5.0.0-alpha.12

### Minor Changes

- [#2821](https://github.com/kubb-labs/kubb/pull/2821) [`f4105fe`](https://github.com/kubb-labs/kubb/commit/f4105fe44e46ec2846e665fd6079290e6d6ce6c6) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - **`@kubb/plugin-ts`**: When `legacy: true`, the type generator now fully matches the v4 output:
  - Grouped parameter types: `<OperationId>PathParams`, `<OperationId>QueryParams`, `<OperationId>HeaderParams`
  - No `<OperationId>RequestConfig` type emitted
  - Wrapper types (`Mutation`/`Query`) use `{ Response, Request?, QueryParams?, Errors }` shape
  - Response union (`MutationResponse`/`QueryResponse`) contains only the 2xx type; no 2xx → `any`
  - Inline enum values in parameters and responses are extracted as named declarations

  Six `@deprecated` resolver methods added to `ResolverTs` for grouped parameter naming (`resolvePathParamsName`, `resolveQueryParamsName`, `resolveHeaderParamsName` and typed variants). Implemented only in `resolverTsLegacy`; will be removed in v6.

  **`@kubb/adapter-oas`**: `collisionDetection` is now part of the public API with a default of `true`.
  - `collisionDetection: true` (default) → full-path enum names, e.g. `OrderParamsStatusEnum`
  - `collisionDetection: false` → immediate-parent enum names with numeric deduplication, e.g. `ParamsStatusEnum`, `ParamsStatusEnum2`

### Patch Changes

- [#2821](https://github.com/kubb-labs/kubb/pull/2821) [`f4105fe`](https://github.com/kubb-labs/kubb/commit/f4105fe44e46ec2846e665fd6079290e6d6ce6c6) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Boolean `const` values are now inlined as literal types instead of generating an external named enum.

  Parameter schemas with an `enum` field now produce a named enum node instead of an anonymous inline literal union.

- Updated dependencies []:
  - @kubb/ast@5.0.0-alpha.12
  - @kubb/core@5.0.0-alpha.12

## 5.0.0-alpha.11

### Minor Changes

- [#2824](https://github.com/kubb-labs/kubb/pull/2824) [`4cfcb62`](https://github.com/kubb-labs/kubb/commit/4cfcb6290ffa11c93f19345c93906af65ec18339) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Refactor parser options: extract `ParserOptions` type, add `enumSuffix` option, change `collisionDetection` default to `true`.

### Patch Changes

- Updated dependencies [[`4cfcb62`](https://github.com/kubb-labs/kubb/commit/4cfcb6290ffa11c93f19345c93906af65ec18339), [`4cfcb62`](https://github.com/kubb-labs/kubb/commit/4cfcb6290ffa11c93f19345c93906af65ec18339)]:
  - @kubb/ast@5.0.0-alpha.11
  - @kubb/core@5.0.0-alpha.11

## 5.0.0-alpha.10

### Patch Changes

- Updated dependencies [[`c8f203c`](https://github.com/kubb-labs/kubb/commit/c8f203c47cf3badef59e7fa382b98b011ead755d)]:
  - @kubb/ast@5.0.0-alpha.10
  - @kubb/core@5.0.0-alpha.10

## 5.0.0-alpha.9

### Patch Changes

- Updated dependencies [[`617aa20`](https://github.com/kubb-labs/kubb/commit/617aa203608222aba2a022ab998ced16f4216ed3)]:
  - @kubb/core@5.0.0-alpha.9
  - @kubb/ast@5.0.0-alpha.9

## 5.0.0-alpha.8

### Major Changes

- [#2803](https://github.com/kubb-labs/kubb/pull/2803) [`978b0d1`](https://github.com/kubb-labs/kubb/commit/978b0d1cb6fadcb08dd71b65bbd1542a02a7a517) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Rename factory functions from `define*` to `create*` to align with Vite ecosystem conventions.

  **Rule:** `define*` is reserved for pure identity/type helpers (no runtime behavior — removing the call doesn't change the value, only loses type inference). `create*` is used for functions that produce instances, wrap builders, or apply logic.

  `defineConfig` is unchanged — it is a pure identity helper.

  | Before            | After             |
  | ----------------- | ----------------- |
  | `definePlugin`    | `createPlugin`    |
  | `defineAdapter`   | `createAdapter`   |
  | `defineGenerator` | `createGenerator` |
  | `defineLogger`    | `createLogger`    |
  | `defineStorage`   | `createStorage`   |

### Patch Changes

- Updated dependencies [[`978b0d1`](https://github.com/kubb-labs/kubb/commit/978b0d1cb6fadcb08dd71b65bbd1542a02a7a517)]:
  - @kubb/core@5.0.0-alpha.8
  - @kubb/ast@5.0.0-alpha.8

## 5.0.0-alpha.7

### Patch Changes

- Updated dependencies [[`bf5f955`](https://github.com/kubb-labs/kubb/commit/bf5f955ec285badb0d99a3950b0a880622180ec2)]:
  - @kubb/core@5.0.0-alpha.7
  - @kubb/ast@5.0.0-alpha.7

## 5.0.0-alpha.6

### Patch Changes

- Updated dependencies []:
  - @kubb/ast@5.0.0-alpha.6
  - @kubb/core@5.0.0-alpha.6

## 5.0.0-alpha.5

### Minor Changes

- [#2782](https://github.com/kubb-labs/kubb/pull/2782) [`f373168`](https://github.com/kubb-labs/kubb/commit/f37316845ef3f8753a93e04a946b333ee4e42073) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - - **`@kubb/ast`**: Added `never` to `PrimitiveSchemaType` and `SchemaNodeByType`. Added `UrlSchemaNode` type with optional `path` field for Express-style template literal generation. Excluded `url` from `ScalarSchemaType`. Added `applyParamsCasing` helper to transform parameter names before schema building.
  - **`@kubb/adapter-oas`**: Added `unknownType` and `emptySchemaType` options to `convertSchema` so callers can control the type emitted for empty or untyped schemas. Added `url` special-type handling in the parser.
  - **`@kubb/core`**: `resolveOptions` now prevents recursive overrides by typing `OverrideItem.options` as `Omit<Partial<TOptions>, 'override'>`.
  - **`@kubb/plugin-ts`**: New v2 schema-builder utilities — `buildDataSchemaNode`, `buildParamsSchema`, `buildResponsesSchemaNode`, and `buildResponseUnionSchemaNode` — for generating typed `Data`, `Responses`, and `Response` types from an `OperationNode`. The printer now handles the `never` schema type.

### Patch Changes

- Updated dependencies [[`f373168`](https://github.com/kubb-labs/kubb/commit/f37316845ef3f8753a93e04a946b333ee4e42073)]:
  - @kubb/ast@5.0.0-alpha.5
  - @kubb/core@5.0.0-alpha.5

## 5.0.0-alpha.4

### Patch Changes

- Updated dependencies [[`64e3d85`](https://github.com/kubb-labs/kubb/commit/64e3d8583c50c073bfe8945dcda5e700d262d9d9)]:
  - @kubb/ast@5.0.0-alpha.4
  - @kubb/core@5.0.0-alpha.4

## 5.0.0-alpha.3

### Minor Changes

- [#2752](https://github.com/kubb-labs/kubb/pull/2752) [`827b444`](https://github.com/kubb-labs/kubb/commit/827b444e7c7c62d36ba9eaed7303ed0d18a7fa45) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - - Improved discriminator handling — named and inline enum variants are now generated correctly for discriminator properties.
  - Better support for string-based types (`uuid`, `email`, `url`, `datetime`, `date`, `time`) so they are consistently emitted as plain strings when expected.
  - Operation paths are now available in Express-style format (e.g. `/pets/:petId`) making it easier to use them directly in route definitions.

### Patch Changes

- Updated dependencies [[`827b444`](https://github.com/kubb-labs/kubb/commit/827b444e7c7c62d36ba9eaed7303ed0d18a7fa45)]:
  - @kubb/ast@5.0.0-alpha.3
  - @kubb/core@5.0.0-alpha.3

## 5.0.0-alpha.2

### Patch Changes

- Updated dependencies [[`4f5a4ef`](https://github.com/kubb-labs/kubb/commit/4f5a4efc6169e9e5ef2cfd629a8ed7ff5714727b)]:
  - @kubb/core@5.0.0-alpha.2
  - @kubb/ast@5.0.0-alpha.2

## 5.0.0-alpha.1

### Major Changes

- [`a4682ea`](https://github.com/kubb-labs/kubb/commit/a4682ea8896ef7d9ccae1b6e9abd6ed7bcaac073) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - The minimum required Node.js version is 22.

### Patch Changes

- Updated dependencies [[`a4682ea`](https://github.com/kubb-labs/kubb/commit/a4682ea8896ef7d9ccae1b6e9abd6ed7bcaac073)]:
  - @kubb/core@5.0.0-alpha.1
  - @kubb/ast@5.0.0-alpha.1

## 5.0.0-alpha.0

### Patch Changes

- Updated dependencies [[`2d474ef`](https://github.com/kubb-labs/kubb/commit/2d474ef68bad43e13ec34e762194048cd2a194d9)]:
  - @kubb/core@5.0.0-alpha.0
  - @kubb/ast@5.0.0-alpha.0

## 4.36.1

### Patch Changes

- Updated dependencies [[`a4ac8d2`](https://github.com/kubb-labs/kubb/commit/a4ac8d28d4b17f5275c3fbe3dedfff0ac3bc3357)]:
  - @kubb/core@4.36.1
  - @kubb/ast@4.36.1

## 4.36.0

### Patch Changes

- Updated dependencies [[`4e06911`](https://github.com/kubb-labs/kubb/commit/4e0691160314ff3b9054fbba3efcaeb4c9b10008)]:
  - @kubb/core@4.36.0
  - @kubb/ast@4.36.0

## 4.35.1

### Patch Changes

- Updated dependencies []:
  - @kubb/ast@4.35.1
  - @kubb/core@4.35.1

## 4.35.0

### Patch Changes

- Updated dependencies []:
  - @kubb/ast@4.35.0
  - @kubb/core@4.35.0
