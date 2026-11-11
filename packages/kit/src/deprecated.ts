import { ast } from '@kubb/ast'
import { camelCase as camel, pascalCase as pascal } from '@kubb/core'
import { macroDedupeUnion } from './macros/macroDedupeUnion.ts'

/** @deprecated Use `casing.camel`. Removed in Kubb v6. */
export const camelCase = camel

/** @deprecated Use `casing.pascal`. Removed in Kubb v6. */
export const pascalCase = pascal

/** @deprecated Use `ast.ref.name`. Removed in Kubb v6. */
export const extractRefName = ast.ref.name

/** @deprecated Use `ast.ref.sync`. Removed in Kubb v6. */
export const syncSchemaRef = ast.ref.sync

/** @deprecated Use `ast.schema.isString`. Removed in Kubb v6. */
export const isStringType = ast.schema.isString

/** @deprecated Use `ast.graph.containsCircular`. Removed in Kubb v6. */
export const containsCircularRef = ast.graph.containsCircular

/**
 * The name `macroDedupeUnion` had before 5.16. Kept so a plugin built against an older `@kubb/kit` keeps running.
 *
 * @deprecated Use `macroDedupeUnion`. Removed in the next major.
 */
export const macroSimplifyUnion = macroDedupeUnion
