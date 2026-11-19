import { ast } from '@kubb/ast'
import { camelCase as camel, pascalCase as pascal } from '@kubb/core'
import { macroDedupeUnion } from './macros/macroDedupeUnion.ts'

/** @deprecated Use `casing.camel`. Removed in Kubb v6. */
export const camelCase = camel

/** @deprecated Use `casing.pascal`. Removed in Kubb v6. */
export const pascalCase = pascal

/** @deprecated Use `ast.ref.getName`. Removed in Kubb v6. */
export const extractRefName = ast.ref.getName

/** @deprecated Use `ast.ref.mergeSchema`. Removed in Kubb v6. */
export const syncSchemaRef = ast.ref.mergeSchema

/** @deprecated Use `ast.schema.is(node, 'string')`. Removed in Kubb v6. */
export const isStringType = (node: ast.SchemaNode): boolean => ast.schema.is(node, 'string')

/**
 * The name `macroDedupeUnion` had before 5.16. Kept so a plugin built against an older `@kubb/kit` keeps running.
 *
 * @deprecated Use `macroDedupeUnion`. Removed in the next major.
 */
export const macroSimplifyUnion = macroDedupeUnion
