/**
 * Re-exports the `@kubb/ast` surface so consumers reach it as a single `ast` namespace from
 * `@kubb/core`, the way the TypeScript compiler exposes its `ts` object. Node constructors live
 * under `ast.factory.createX`, mirroring how `ts.factory.createX` groups node creation, while node
 * definitions and helpers (`ast.schemaDef`, `ast.buildGroupParam`, ...) stay on the namespace root.
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
