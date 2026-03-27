import { createFunctionParameter, createFunctionParameters, createObjectBindingParameter, functionPrinter } from '@kubb/ast'
import type { FunctionParameterNode, FunctionParametersNode, ObjectBindingParameterNode, OperationNode } from '@kubb/ast/types'
import type { ResolverTs } from '@kubb/plugin-ts'
import { File, Function } from '@kubb/react-fabric'
import type { FabricReactNode } from '@kubb/react-fabric/types'
import type { PluginCypress } from '../types.ts'
import { buildTypeNames } from '../utils.ts'

/**
 * Pre-computed type name information for a single parameter or request/response node.
 */
type TypeParamInfo = {
  /** Parameter name (after casing applied). */
  name: string
  /** Original parameter name from the AST node (before casing). Used for URL path segment matching. */
  originalName: string
  /** Resolved TypeScript type name from plugin-ts's resolver. */
  typedName: string
  /** Whether the parameter is required. */
  required: boolean
}

/**
 * Pre-computed type name information for all parts of an operation.
 * Computed in the generator using the plugin-ts resolver.
 */
export type TypeNames = {
  pathParams: Array<TypeParamInfo>
  queryParams: Array<TypeParamInfo>
  headerParams: Array<TypeParamInfo>
  requestBody?: { typedName: string }
  response: { typedName: string }
  /**
   * Grouped param type names — set when the plugin-ts resolver uses the kubbV4 compatibility preset.
   * When present, these types replace the per-param `typedName` entries for imports and function parameters.
   */
  grouped?: {
    pathParams?: string
    queryParams?: string
    headerParams?: string
  }
}

type Props = {
  /**
   * Name of the generated `cy.request` function.
   */
  name: string
  /**
   * The operation AST node; provides `method`, `path`, and parameter metadata.
   */
  node: OperationNode
  /**
   * The plugin-ts resolver — used by `getParams` to derive TypeScript type names.
   */
  resolver: ResolverTs
  /**
   * Pre-computed type names from the generator (used for urlTemplate, returnType, requestOptions).
   */
  typeNames: TypeNames
  baseURL: string | undefined
  dataReturnType: PluginCypress['resolvedOptions']['dataReturnType']
  paramsCasing: PluginCypress['resolvedOptions']['paramsCasing']
  paramsType: PluginCypress['resolvedOptions']['paramsType']
  pathParamsType: PluginCypress['resolvedOptions']['pathParamsType']
}

type GetParamsProps = {
  node: OperationNode
  resolver: ResolverTs
  paramsCasing: PluginCypress['resolvedOptions']['paramsCasing']
  paramsType: PluginCypress['resolvedOptions']['paramsType']
  pathParamsType: PluginCypress['resolvedOptions']['pathParamsType']
}

/**
 * Builds an inline TypeScript object type string from a list of typed params.
 * @example buildInlineObjectType([{ name: 'limit', typedName: 'ListPetsQueryLimit', required: false }])
 * // → '{ limit?: ListPetsQueryLimit }'
 */
function buildInlineObjectType(params: Array<TypeParamInfo>): string {
  const props = params.map((p) => `${p.name}${p.required ? '' : '?'}: ${p.typedName}`).join('; ')
  return `{ ${props} }`
}

function getParams({ node, resolver, paramsType, paramsCasing, pathParamsType }: GetParamsProps): FunctionParametersNode {
  const { pathParams, queryParams, headerParams, requestBody, grouped } = buildTypeNames({ node, paramsCasing, resolver })

  const allPathOptional = pathParams.every((p) => !p.required)

  // When grouped types are available (kubbV4 compatibility preset), use them for the params type.
  const queryParamsType = grouped?.queryParams ?? (queryParams.length > 0 ? buildInlineObjectType(queryParams) : undefined)
  const headerParamsType = grouped?.headerParams ?? (headerParams.length > 0 ? buildInlineObjectType(headerParams) : undefined)
  const queryParamsOptional = queryParams.every((p) => !p.required)
  const headerParamsOptional = headerParams.every((p) => !p.required)

  if (paramsType === 'object') {
    // Single destructured object wrapping all inputs (except options).
    // For grouped path params, individual param names are used untyped (the outer object provides no combined type).
    const innerParams = [
      ...(grouped?.pathParams
        ? pathParams.map((p) => createFunctionParameter({ name: p.name, optional: !p.required }))
        : pathParams.map((p) => createFunctionParameter({ name: p.name, type: p.typedName, optional: !p.required }))),
      requestBody ? createFunctionParameter({ name: 'data', type: requestBody.typedName, optional: false }) : null,
      queryParamsType ? createFunctionParameter({ name: 'params', type: queryParamsType, optional: queryParamsOptional }) : null,
      headerParamsType ? createFunctionParameter({ name: 'headers', type: headerParamsType, optional: headerParamsOptional }) : null,
    ].filter((p): p is FunctionParameterNode => p !== null)

    const allChildrenOptional = innerParams.every((p) => p.optional || p.default !== undefined)

    return createFunctionParameters({
      params: [
        createObjectBindingParameter({
          properties: innerParams,
          default: allChildrenOptional ? '{}' : undefined,
        }),
        createFunctionParameter({ name: 'options', type: 'Partial<Cypress.RequestOptions>', optional: false, default: '{}' }),
      ],
    })
  }

  // Inline mode: path params come first, then scalar params.
  let pathParamNodes: Array<FunctionParameterNode | ObjectBindingParameterNode> = []

  if (pathParams.length > 0) {
    if (grouped?.pathParams) {
      // Legacy (kubbV4): { petId }: DeletePetPathParams
      pathParamNodes = [
        createObjectBindingParameter({
          properties: pathParams.map((p) => createFunctionParameter({ name: p.name, optional: !p.required })),
          type: grouped.pathParams,
          default: allPathOptional ? '{}' : undefined,
        }),
      ]
    } else if (pathParamsType === 'object') {
      // Object mode: { petId }: { petId: ShowPetByIdPathPetId }
      pathParamNodes = [
        createObjectBindingParameter({
          properties: pathParams.map((p) => createFunctionParameter({ name: p.name, type: p.typedName, optional: !p.required })),
          default: allPathOptional ? '{}' : undefined,
        }),
      ]
    } else {
      // Inline: petId: ShowPetByIdPathPetId, ...
      pathParamNodes = pathParams.map((p) => createFunctionParameter({ name: p.name, type: p.typedName, optional: !p.required }))
    }
  }

  const scalarParams = [
    requestBody ? createFunctionParameter({ name: 'data', type: requestBody.typedName, optional: false }) : null,
    queryParamsType ? createFunctionParameter({ name: 'params', type: queryParamsType, optional: queryParamsOptional }) : null,
    headerParamsType ? createFunctionParameter({ name: 'headers', type: headerParamsType, optional: headerParamsOptional }) : null,
    createFunctionParameter({ name: 'options', type: 'Partial<Cypress.RequestOptions>', optional: false, default: '{}' }),
  ].filter((p): p is FunctionParameterNode => p !== null)

  return createFunctionParameters({ params: [...pathParamNodes, ...scalarParams] })
}

/**
 * Converts an Express-style path (`/pets/:petId`) to a JavaScript template-literal string.
 * Applies casing to parameter names if `paramsCasing` is set.
 *
 * @example
 * buildUrlTemplate('/pets/:petId', [{ name: 'petId', originalName: 'petId', ... }], undefined, 'https://api.example.com')
 * // → '`https://api.example.com/pets/${petId}`'
 */
function buildUrlTemplate(expressPath: string, pathParams: Array<TypeParamInfo>, baseURL: string | undefined): string {
  // Replace each :originalName segment using the matching cased param name
  const result = expressPath.replace(/:(\w+)/g, (_, originalName) => {
    const param = pathParams.find((p) => p.originalName === originalName)
    return param ? `\${${param.name}}` : `:${originalName}`
  })
  return `\`${baseURL ?? ''}${result}\``
}

export function Request({ baseURL, name, dataReturnType, typeNames, resolver, node, paramsType, paramsCasing, pathParamsType }: Props): FabricReactNode {
  const params = getParams({ node, resolver, paramsType, paramsCasing, pathParamsType })

  const urlTemplate = buildUrlTemplate(node.path, typeNames.pathParams, baseURL)

  const returnType =
    dataReturnType === 'data' ? `Cypress.Chainable<${typeNames.response.typedName}>` : `Cypress.Chainable<Cypress.Response<${typeNames.response.typedName}>>`

  // Build the request options object
  const requestOptions: string[] = [`method: '${node.method.toLowerCase()}'`, `url: ${urlTemplate}`]

  if (typeNames.queryParams.length > 0) {
    requestOptions.push('qs: params')
  }

  if (typeNames.headerParams.length > 0) {
    requestOptions.push('headers')
  }

  if (typeNames.requestBody) {
    requestOptions.push('body: data')
  }

  requestOptions.push('...options')

  return (
    <File.Source name={name} isIndexable isExportable>
      <Function name={name} export params={functionPrinter({ mode: 'declaration' }).print(params) ?? undefined} returnType={returnType}>
        {dataReturnType === 'data'
          ? `return cy.request<${typeNames.response.typedName}>({
  ${requestOptions.join(',\n  ')}
}).then((res) => res.body)`
          : `return cy.request<${typeNames.response.typedName}>({
  ${requestOptions.join(',\n  ')}
})`}
      </Function>
    </File.Source>
  )
}

Request.getParams = getParams
