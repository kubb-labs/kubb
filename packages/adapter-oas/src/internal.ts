/**
 * Internal building blocks shared with other adapters, reached through `@kubb/adapter-oas/internal`.
 *
 * `@kubb/adapter-arazzo` resolves its `sourceDescriptions` to real OpenAPI documents and needs the
 * same loading, `$ref` resolution, and schema conversion this adapter already does. Re-implementing
 * either would drift from the OAS behavior every plugin already depends on.
 *
 * This entry has no stability guarantee: it moves with the OAS adapter's internals, not with semver.
 */
export { assertDocument, bundleDocument, parseDocument, parseFromConfig, validateDocument } from './load/normalize.ts'
export { assertInputExists, resolveSource, urlRegExp } from './load/source.ts'
export { getSchemas } from './model/components.ts'
export { getOperationId, getOperations } from './operation.ts'
export { createSchemaParser } from './parser.ts'
export type { OasParserContext } from './parser.ts'
export { createRefs } from './refs.ts'
export { scanSchema } from './schemaDiagnostics.ts'
export type { Refs } from './refs.ts'
export { DEFAULT_PARSER_OPTIONS } from './constants.ts'
