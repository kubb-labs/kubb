/**
 * Assembles the `@kubb/ast` surface into a single `ast` namespace for `@kubb/core`, the way the
 * TypeScript compiler exposes its `ts` object. The `@kubb/ast` root supplies node definitions and
 * helpers (`ast.schemaDef`, `ast.narrowSchema`, ...), and the `@kubb/ast/factory` subpath supplies
 * the node constructors under `ast.factory.createX`, mirroring `ts.factory.createX`. The
 * `@kubb/ast/utils` subpath stays out of this namespace, it targets specific plugin use cases.
 *
 * This `ast` namespace is a convenience aggregate, so reaching for any member pulls the AST library
 * in, the same way `ts.factory.createNode` pulls all of TypeScript. Both packages set
 * `sideEffects: false`, so a bundle that never touches `ast` drops it entirely. Code that wants
 * fine-grained tree-shaking imports the subpaths directly (`@kubb/ast/factory`, `@kubb/ast`,
 * `@kubb/ast/utils`) instead of the aggregate, the way the packages here already do internally.
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
