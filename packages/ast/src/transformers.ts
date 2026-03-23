import { createParameter } from './factory.ts'
import type { OperationNode, ParameterLocation, ParameterNode } from './nodes/index.ts'
import type { StatusCode } from './nodes/http.ts'
import { buildGroupedParamSchema, nameEnumsInSchema } from './utils.ts'
import type { Visitor } from './visitor.ts'

/**
 * Naming callbacks required by {@link createLegacyOperationTransformer}.
 *
 * All three methods should return the **typed** (PascalCase) name of the
 * generated TypeScript type, e.g. `"FindPetsByStatusQueryParams"`.
 * Plugin implementations typically derive these values from the plugin's
 * resolver via `resolver.resolveParamTypedName(node, {in: paramIn, name: 'Params', ...})`.
 */
export type LegacyTransformerNaming = {
  /**
   * Returns the typed name of the grouped params type for the given parameter location.
   *
   * @example
   * ```ts
   * getParamGroupTypedName(node, 'query') // → 'FindPetsByStatusQueryParams'
   * getParamGroupTypedName(node, 'path')  // → 'ShowPetByIdPathParams'
   * ```
   */
  getParamGroupTypedName(node: OperationNode, paramIn: ParameterLocation): string
  /**
   * Returns the typed name of the response schema for the given status code.
   * Used to name unnamed inline enums within response schemas.
   *
   * @example
   * ```ts
   * getResponseStatusName(node, '200') // → 'FindPetsByStatus200'
   * ```
   */
  getResponseStatusName(node: OperationNode, statusCode: StatusCode): string
  /**
   * Returns the typed name of the request body (mutation/query request) schema.
   * Used to name unnamed inline enums within the request body schema.
   *
   * @example
   * ```ts
   * getDataName(node) // → 'AddPetMutationRequest'
   * ```
   */
  getDataName(node: OperationNode): string
}


/**
 * Creates an AST `Visitor` that transforms an `OperationNode` into the legacy v4 output shape.
 *
 * **What this transformer does to the operation node:**
 *
 * 1. **Parameter grouping** — Individual `path`, `query`, and `header` parameters are
 *    replaced by at most three synthetic `ParameterNode`s, each with `name = 'Params'`
 *    and an inline object schema.  After this transformation the downstream generator's
 *    uniform param-rendering loop (`resolveParamTypedName(node, param)`) naturally
 *    produces `<OperationId>PathParams`, `<OperationId>QueryParams`, and
 *    `<OperationId>HeaderParams` without any mode-specific branching.
 *
 * 2. **Enum extraction in responses** — Unnamed inline enums inside every response
 *    schema are given a generated name (e.g. `DeletePet200EnumKey`) so they are
 *    rendered as top-level enum declarations.
 *
 * 3. **Enum extraction in the request body** — Same extraction applied to the
 *    request-body schema.
 *
 * **Usage**
 *
 * Add the visitor returned by this function to the plugin's `transformers` array
 * when `legacy: true`.  The generator processes the already-restructured node
 * without requiring any legacy-specific branching.
 *
 * @param naming - Naming callbacks that derive type names from the operation node.
 *   The plugin wires these up from its resolver implementation.
 *
 * @deprecated Will be removed when `legacy` support is dropped in v6.
 */
export function createLegacyOperationTransformer(naming: LegacyTransformerNaming): Visitor {
  return {
    operation(node: OperationNode): OperationNode {
      const pathParams = node.parameters.filter((p) => p.in === 'path')
      const queryParams = node.parameters.filter((p) => p.in === 'query')
      const headerParams = node.parameters.filter((p) => p.in === 'header')

      const groupedParameters: Array<ParameterNode> = []

      if (pathParams.length > 0) {
        const typedName = naming.getParamGroupTypedName(node, 'path')

        groupedParameters.push(
          createParameter({
            in: 'path',
            name: 'Params',
            required: true,
            schema: buildGroupedParamSchema(pathParams, typedName),
          }),
        )
      }

      if (queryParams.length > 0) {
        const typedName = naming.getParamGroupTypedName(node, 'query')

        groupedParameters.push(
          createParameter({
            in: 'query',
            name: 'Params',
            required: false,
            schema: buildGroupedParamSchema(queryParams, typedName),
          }),
        )
      }

      if (headerParams.length > 0) {
        const typedName = naming.getParamGroupTypedName(node, 'header')

        groupedParameters.push(
          createParameter({
            in: 'header',
            name: 'Params',
            required: true,
            schema: buildGroupedParamSchema(headerParams, typedName),
          }),
        )
      }

      const transformedResponses = node.responses.map((res) => ({
        ...res,
        schema: res.schema ? nameEnumsInSchema(res.schema, naming.getResponseStatusName(node, res.statusCode)) : res.schema,
      }))

      const transformedRequestBody = node.requestBody?.schema
        ? { ...node.requestBody, schema: nameEnumsInSchema(node.requestBody.schema, naming.getDataName(node)) }
        : node.requestBody

      return {
        ...node,
        parameters: groupedParameters,
        responses: transformedResponses,
        requestBody: transformedRequestBody,
      }
    },
  }
}
