---
"@kubb/plugin-mcp": minor
"@kubb/plugin-ts": patch
---

### `@kubb/plugin-mcp`

- Migrate to v5 architecture with `defineResolver`, `definePresets`, and `defineGenerator`.
- Add `compatibilityPreset` support: `'default'` (v5) and `'kubbV4'` (legacy naming).
- Add `McpHandler` component using `createOperationParams` from `@kubb/ast` for automatic v5/v4 param handling.
- Add `Server` component for MCP tool registration with zod schema validation.
- Add `serverGeneratorLegacy` for kubbV4 preset using grouped zod schemas (`QueryParamsSchema`, `HeaderParamsSchema`, `ResponseSchema`).
- Default preset uses individual zod schemas (`createPetsPathUuidSchema`, `createPetsQueryOffsetSchema`) composed into `z.object()`.
- Add `resolverMcp` with `Handler` suffix naming convention.
- Add `resolver`, `transformer`, and `printer` options following the v5 plugin pattern.
- **Breaking:** Replace `resolvers?: Array<ResolverMcp>` with `resolver?: Partial<ResolverMcp> & ThisType<ResolverMcp>`.
- **Breaking:** Replace `transformers?: Array<Visitor>` with `transformer?: Visitor`.

### `@kubb/plugin-ts`

- Fix `functionPrinter` struct property name quoting: property names with special characters (e.g. `X-EXAMPLE`) are now properly quoted in output.
