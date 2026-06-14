/**
 * Assembles the `@kubb/ast` surface into a single `ast` namespace for `@kubb/core`, the way the
 * TypeScript compiler exposes its `ts` object. The `@kubb/ast` root supplies node definitions and
 * helpers (`ast.schemaDef`, `ast.narrowSchema`, ...), and the `@kubb/ast/factory` subpath supplies
 * the node constructors under `ast.factory.createX`, mirroring `ts.factory.createX`. The
 * `@kubb/ast/utils` subpath stays out of this namespace, it targets specific plugin use cases.
 *
 * @example
 * ```ts
 * import { ast } from '@kubb/core'
 *
 * const schema = ast.factory.createSchema({ name: 'Pet', type: 'object' })
 * const def = ast.schemaDef
 * ```
 */
export * from '@kubb/ast'
export * as factory from '@kubb/ast/factory'
