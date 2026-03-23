import type { OperationNode } from '@kubb/ast/types'
import type { Visitor } from '@kubb/ast/types'
import { nameUnnamedEnums } from '../generators/utils.ts'
import type { ResolverTs } from '../types.ts'

/**
 * Creates an AST `Visitor` that applies the legacy v4 schema transformations to an `OperationNode`.
 *
 * When this visitor is added to the `transformers` option (automatically done by the plugin
 * when `legacy: true`), the single `typeGenerator` produces the legacy output shape without any
 * `if (legacy)` branching inside the generator itself.
 *
 * **What this transformer does:**
 * - Names unnamed inline enums inside every response schema using `nameUnnamedEnums`, so they are
 *   extracted as dedicated enum declarations (e.g. `DeletePet200StatusEnum`).
 * - Names unnamed inline enums inside the request-body schema (e.g. `CreatePetsMutationRequestBodyEnum`).
 *
 * **What it deliberately does NOT do:**
 * - It does not restructure the `parameters` array.  Grouped `PathParams` / `QueryParams` /
 *   `HeaderParams` types are produced by the paired `resolverTsLegacy` schema-builder methods
 *   (`buildPathParamsSchema`, `buildQueryParamsSchema`, `buildHeaderParamsSchema`), which use
 *   the resolver's own naming helpers and therefore work correctly even when the resolver's
 *   `default()` function is overridden (e.g. in tests that append a naming suffix).
 *
 * @param resolver - The base resolver used for naming (typically `resolverTsLegacy`).
 *
 * @deprecated Will be removed when `legacy` support is dropped in v6.
 */
export function createTransformerTsLegacy(resolver: ResolverTs): Visitor {
  return {
    operation(node: OperationNode): OperationNode {
      const transformedResponses = node.responses.map((res) => ({
        ...res,
        schema: res.schema ? nameUnnamedEnums(res.schema, resolver.resolveResponseStatusName(node, res.statusCode)) : res.schema,
      }))

      const transformedRequestBody = node.requestBody?.schema
        ? { ...node.requestBody, schema: nameUnnamedEnums(node.requestBody.schema, resolver.resolveDataName(node)) }
        : node.requestBody

      return {
        ...node,
        responses: transformedResponses,
        requestBody: transformedRequestBody,
      }
    },
  }
}
