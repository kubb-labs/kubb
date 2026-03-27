import type { OperationNode } from '@kubb/ast/types'
import { File, Function, FunctionParams } from '@kubb/react-fabric'
import type { FabricReactNode } from '@kubb/react-fabric/types'
import type { PluginCypress } from '../types.ts'
import type { TypeNames } from '../utils.ts'

type Props = {
  /**
   * Name of the function
   */
  name: string
  /**
   * AST operation node
   */
  node: OperationNode
  /**
   * Pre-computed type names from plugin-ts resolver
   */
  typeNames: TypeNames
  baseURL: string | undefined
  dataReturnType: PluginCypress['resolvedOptions']['dataReturnType']
  paramsCasing: PluginCypress['resolvedOptions']['paramsCasing']
  paramsType: PluginCypress['resolvedOptions']['paramsType']
  pathParamsType: PluginCypress['resolvedOptions']['pathParamsType']
}

type GetParamsProps = {
  paramsType: PluginCypress['resolvedOptions']['paramsType']
  pathParamsType: PluginCypress['resolvedOptions']['pathParamsType']
  typeNames: TypeNames
}

function getParams({ paramsType, pathParamsType, typeNames }: GetParamsProps) {
  if (paramsType === 'object') {
    const pathParamsChildren: Record<string, { type: string; optional?: boolean }> = {}
    for (const p of typeNames.pathParams) {
      pathParamsChildren[p.name] = { type: p.typedName, optional: !p.required }
    }

    return FunctionParams.factory({
      data: {
        mode: 'object',
        children: {
          ...pathParamsChildren,
          data: typeNames.requestBody
            ? {
                type: typeNames.requestBody.typedName,
                optional: !typeNames.requestBody.required,
              }
            : undefined,
          params: typeNames.queryParams.length
            ? {
                type: typeNames.queryParams.map((p) => `${p.name}${!p.required ? '?' : ''}: ${p.typedName}`).join('; '),
                optional: typeNames.queryParams.every((p) => !p.required),
              }
            : undefined,
          headers: typeNames.headerParams.length
            ? {
                type: typeNames.headerParams.map((p) => `${p.name}${!p.required ? '?' : ''}: ${p.typedName}`).join('; '),
                optional: typeNames.headerParams.every((p) => !p.required),
              }
            : undefined,
        },
      },
      options: {
        type: 'Partial<Cypress.RequestOptions>',
        default: '{}',
      },
    })
  }

  const pathParamsChildren: Record<string, { type: string; optional?: boolean }> = {}
  for (const p of typeNames.pathParams) {
    pathParamsChildren[p.name] = { type: p.typedName, optional: !p.required }
  }

  return FunctionParams.factory({
    pathParams: typeNames.pathParams.length
      ? {
          mode: pathParamsType === 'object' ? 'object' : 'inlineSpread',
          children: pathParamsChildren,
          default: typeNames.pathParams.every((p) => !p.required) ? '{}' : undefined,
        }
      : undefined,
    data: typeNames.requestBody
      ? {
          type: typeNames.requestBody.typedName,
          optional: !typeNames.requestBody.required,
        }
      : undefined,
    params: typeNames.queryParams.length
      ? {
          type: `{ ${typeNames.queryParams.map((p) => `${p.name}${!p.required ? '?' : ''}: ${p.typedName}`).join('; ')} }`,
          optional: typeNames.queryParams.every((p) => !p.required),
        }
      : undefined,
    headers: typeNames.headerParams.length
      ? {
          type: `{ ${typeNames.headerParams.map((p) => `${p.name}${!p.required ? '?' : ''}: ${p.typedName}`).join('; ')} }`,
          optional: typeNames.headerParams.every((p) => !p.required),
        }
      : undefined,
    options: {
      type: 'Partial<Cypress.RequestOptions>',
      default: '{}',
    },
  })
}

/**
 * Builds the URL template string from the operation path.
 * Replaces `:paramName` with `${paramName}`.
 */
function buildUrlTemplate(operationPath: string, baseURL: string): string {
  const template = operationPath.replace(/:(\w+)/g, '${$1}')
  if (baseURL) {
    return `\`${baseURL}${template}\``
  }
  return `\`${template}\``
}

export function Request({ baseURL = '', name, dataReturnType, typeNames, node, paramsType, pathParamsType }: Props): FabricReactNode {
  const params = getParams({ paramsType, pathParamsType, typeNames })

  const returnType =
    dataReturnType === 'data' ? `Cypress.Chainable<${typeNames.response.typedName}>` : `Cypress.Chainable<Cypress.Response<${typeNames.response.typedName}>>`

  const urlTemplate = buildUrlTemplate(node.path, baseURL)

  const requestOptions: string[] = [`method: '${node.method}'`, `url: ${urlTemplate}`]

  if (typeNames.queryParams.length) {
    requestOptions.push('qs: params')
  }

  if (typeNames.headerParams.length) {
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
