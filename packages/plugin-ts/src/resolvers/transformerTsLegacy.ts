import { createLegacyOperationTransformer, createSchema } from '@kubb/ast'
import type { Visitor } from '@kubb/ast/types'
import type { ResolverTs } from '../types.ts'

/**
 * Creates an AST `Visitor` that transforms an `OperationNode` into the legacy v4 output shape,
 * wiring the plugin-ts resolver as the naming source for the generic `createLegacyOperationTransformer`.
 *
 * **What happens:**
 * - Individual `path` / `query` / `header` parameters are replaced by synthetic grouped
 *   `ParameterNode`s (`{name: 'Params', in: '...'}`) with inline object schemas.
 *   The generator's uniform `resolveParamTypedName(node, param)` then naturally produces
 *   `<OperationId>PathParams` / `<OperationId>QueryParams` / `<OperationId>HeaderParams`
 *   without any explicit legacy branching.
 * - Unnamed inline enums in response schemas and the request-body schema are given extracted
 *   names (e.g. `DeletePet200EnumKey`) via the resolver's `resolveResponseStatusName` /
 *   `resolveDataName`.
 *
 * Pass the visitor returned by this function as an element of the plugin's `transformers` array
 * when `legacy: true`.  `plugin.ts` does this automatically.
 *
 * @param resolver - The base resolver used for naming (typically `resolverTsLegacy`).
 *
 * @deprecated Will be removed when `legacy` support is dropped in v6.
 */
export function createTransformerTsLegacy(resolver: ResolverTs): Visitor {
  return createLegacyOperationTransformer({
    getParamGroupTypedName(node, paramIn) {
      // Delegate to the legacy resolver's resolveParamTypedName with a synthetic
      // grouped-param marker: name='Params', in=paramIn.  The legacy resolver's
      // resolveParamTypedName override detects name==='Params' and calls the
      // dedicated resolveXxxParamsTypedName method, avoiding double-wrapping when
      // the resolver's default() function is overridden (e.g. in tests).
      return resolver.resolveParamTypedName(node, { in: paramIn, name: 'Params', required: paramIn !== 'query', schema: createSchema({ type: 'never' }) })
    },
    getResponseStatusName(node, statusCode) {
      return resolver.resolveResponseStatusName(node, statusCode)
    },
    getDataName(node) {
      return resolver.resolveDataName(node)
    },
  })
}
