import type { OperationNode } from '@kubb/ast/types'
import { File, Function, FunctionParams } from '@kubb/react-fabric'
import type { FabricReactNode } from '@kubb/react-fabric/types'
import type { PluginCypress } from '../types.ts'

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
   * Pre-computed type names resolved from the plugin-ts resolver.
   */
  typeNames: TypeNames
  baseURL: string | undefined
  dataReturnType: PluginCypress['resolvedOptions']['dataReturnType']
  paramsCasing: PluginCypress['resolvedOptions']['paramsCasing']
  paramsType: PluginCypress['resolvedOptions']['paramsType']
  pathParamsType: PluginCypress['resolvedOptions']['pathParamsType']
}

type GetParamsProps = {
  paramsCasing: PluginCypress['resolvedOptions']['paramsCasing']
  paramsType: PluginCypress['resolvedOptions']['paramsType']
  pathParamsType: PluginCypress['resolvedOptions']['pathParamsType']
  typeNames: TypeNames
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

function getParams({ paramsType, pathParamsType, typeNames }: GetParamsProps) {
  const { pathParams, queryParams, headerParams, requestBody } = typeNames

  const pathParamChildren = Object.fromEntries(pathParams.map((p) => [p.name, { type: p.typedName, required: p.required }]))
  const allPathOptional = pathParams.every((p) => !p.required)

  if (paramsType === 'object') {
    const children = {
      ...pathParamChildren,
      data: requestBody ? { type: requestBody.typedName, optional: false } : undefined,
      params: queryParams.length > 0 ? { type: buildInlineObjectType(queryParams), optional: queryParams.every((p) => !p.required) } : undefined,
      headers: headerParams.length > 0 ? { type: buildInlineObjectType(headerParams), optional: headerParams.every((p) => !p.required) } : undefined,
    }

    const allChildrenOptional = Object.values(children).every((child) => !child || ('optional' in child ? child.optional : !child.required))

    return FunctionParams.factory({
      data: {
        mode: 'object',
        children,
        default: allChildrenOptional ? '{}' : undefined,
      },
      options: {
        type: 'Partial<Cypress.RequestOptions>',
        default: '{}',
      },
    })
  }

  return FunctionParams.factory({
    pathParams:
      pathParams.length > 0
        ? {
            mode: pathParamsType === 'object' ? 'object' : 'inlineSpread',
            children: pathParamChildren,
            default: allPathOptional ? '{}' : undefined,
          }
        : undefined,
    data: requestBody
      ? {
          type: requestBody.typedName,
          optional: false,
        }
      : undefined,
    params:
      queryParams.length > 0
        ? {
            type: buildInlineObjectType(queryParams),
            optional: queryParams.every((p) => !p.required),
          }
        : undefined,
    headers:
      headerParams.length > 0
        ? {
            type: buildInlineObjectType(headerParams),
            optional: headerParams.every((p) => !p.required),
          }
        : undefined,
    options: {
      type: 'Partial<Cypress.RequestOptions>',
      default: '{}',
    },
  })
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

export function Request({ baseURL, name, dataReturnType, typeNames, node, paramsType, paramsCasing, pathParamsType }: Props): FabricReactNode {
  const params = getParams({ paramsType, paramsCasing, pathParamsType, typeNames })

  const urlTemplate = buildUrlTemplate(node.path, typeNames.pathParams, baseURL)

  const returnType =
    dataReturnType === 'data'
      ? `Cypress.Chainable<${typeNames.response.typedName}>`
      : `Cypress.Chainable<Cypress.Response<${typeNames.response.typedName}>>`

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
      <Function name={name} export params={params.toConstructor()} returnType={returnType}>
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
