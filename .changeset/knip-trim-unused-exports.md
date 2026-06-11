---
'@kubb/adapter-oas': patch
'@kubb/ast': patch
'@kubb/cli': patch
'@kubb/core': patch
'@kubb/parser-md': patch
'@kubb/parser-ts': patch
---

Remove more unused code flagged by knip. None of the removed symbols are part of any package's `exports`, and all were unused across the kubb and plugins repos. Runtime behavior is unchanged.

- `@kubb/parser-ts`: delete the dead `createImport` and `createExport` AST builders, superseded by the string-based `printImport`/`printExport`.
- `@kubb/adapter-oas`: drop the unused `HttpMethods` lookup and the redundant `openapi-types` re-export.
- `@kubb/ast`: drop the unused `buildFixture` mock helper.
- `@kubb/cli`: drop the unused `SUMMARY_SEPARATOR` constant.
- `@kubb/core`: drop the orphaned `mocks/noop` fixtures.
- Several internal-only symbols (`createContent`, `createRequestBody`, `SCALAR_PRIMITIVE_TYPES`, `INDENT_SIZE`, `defaultResolveOptions`, `buildDefaultBanner`, `ReportTiming`, `printFrontmatter`, `SchemaWithMetadata`) drop their redundant `export`.
