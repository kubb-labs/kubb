import { URLPath } from '@kubb/core/utils'
import { type HttpMethod, isOptional } from '@kubb/oas'
import type { OperationSchemas } from '@kubb/plugin-oas'
import { getPathParams } from '@kubb/plugin-oas/utils'
import { File, Function, FunctionParams } from '@kubb/react-fabric'
import type { KubbNode } from '@kubb/react-fabric/types'
import type { PluginCypress } from '../types.ts'

type Props = {
  /**
   * Name of the function
   */
  name: string
  typeSchemas: OperationSchemas
  url: string
  baseURL: string | undefined
  dataReturnType: PluginCypress['resolvedOptions']['dataReturnType']
  paramsCasing: PluginCypress['resolvedOptions']['paramsCasing']
  paramsType: PluginCypress['resolvedOptions']['paramsType']
  pathParamsType: PluginCypress['resolvedOptions']['pathParamsType']
  method: HttpMethod
}

type GetParamsProps = {
  paramsCasing: PluginCypress['resolvedOptions']['paramsCasing']
  paramsType: PluginCypress['resolvedOptions']['paramsType']
  pathParamsType: PluginCypress['resolvedOptions']['pathParamsType']
  typeSchemas: OperationSchemas
}

function getParams({ paramsType, paramsCasing, pathParamsType, typeSchemas }: GetParamsProps) {
  if (paramsType === 'object') {
    return FunctionParams.factory({
      data: {
        mode: 'object',
        children: {
          ...getPathParams(typeSchemas.pathParams, { typed: true, casing: paramsCasing }),
          data: typeSchemas.request?.name
            ? {
                type: typeSchemas.request?.name,
                optional: isOptional(typeSchemas.request?.schema),
              }
            : undefined,
          params: typeSchemas.queryParams?.name
            ? {
                type: typeSchemas.queryParams?.name,
                optional: isOptional(typeSchemas.queryParams?.schema),
              }
            : undefined,
          headers: typeSchemas.headerParams?.name
            ? {
                type: typeSchemas.headerParams?.name,
                optional: isOptional(typeSchemas.headerParams?.schema),
              }
            : undefined,
        },
      },
      options: {
        type: 'Partial<Cypress.RequestOptions>',
        optional: true,
        default: '{}',
      },
    })
  }

  return FunctionParams.factory({
    pathParams: typeSchemas.pathParams?.name
      ? {
          mode: pathParamsType === 'object' ? 'object' : 'inlineSpread',
          children: getPathParams(typeSchemas.pathParams, { typed: true, casing: paramsCasing }),
          optional: isOptional(typeSchemas.pathParams?.schema),
        }
      : undefined,
    data: typeSchemas.request?.name
      ? {
          type: typeSchemas.request?.name,
          optional: isOptional(typeSchemas.request?.schema),
        }
      : undefined,
    params: typeSchemas.queryParams?.name
      ? {
          type: typeSchemas.queryParams?.name,
          optional: isOptional(typeSchemas.queryParams?.schema),
        }
      : undefined,
    headers: typeSchemas.headerParams?.name
      ? {
          type: typeSchemas.headerParams?.name,
          optional: isOptional(typeSchemas.headerParams?.schema),
        }
      : undefined,
    options: {
      type: 'Partial<Cypress.RequestOptions>',
      optional: true,
      default: '{}',
    },
  })
}

export function Request({ baseURL = '', name, dataReturnType, typeSchemas, url, method, paramsType, paramsCasing, pathParamsType }: Props): KubbNode {
  const path = new URLPath(url, { casing: paramsCasing })
  const params = getParams({ paramsType, paramsCasing, pathParamsType, typeSchemas })

  const returnType =
    dataReturnType === 'data' ? `Cypress.Chainable<${typeSchemas.response.name}>` : `Cypress.Chainable<Cypress.Response<${typeSchemas.response.name}>>`

  // Build the URL template string - this will convert /pets/:petId to /pets/${petId}
  const urlTemplate = path.toTemplateString({ prefix: baseURL })
  // Escape remaining colons for Cypress (those not part of template literals)
  const escapedUrlTemplate = urlTemplate.replace(/:/g, '\\\\:')

  // Build request options object
  const requestOptions: string[] = [`method: '${method}'`, `url: ${escapedUrlTemplate}`]

  // Add query params if they exist
  if (typeSchemas.queryParams?.name) {
    requestOptions.push('qs: params')
  }

  // Add headers if they exist
  if (typeSchemas.headerParams?.name) {
    requestOptions.push('headers')
  }

  // Add body if request schema exists
  if (typeSchemas.request?.name) {
    requestOptions.push('body: data')
  }

  // Spread additional Cypress options
  requestOptions.push('...options')

  return (
    <File.Source name={name} isIndexable isExportable>
      <Function name={name} export params={params.toConstructor()} returnType={returnType}>
        {dataReturnType === 'data'
          ? `return cy.request<${typeSchemas.response.name}>({
  ${requestOptions.join(',\n  ')}
}).then((res) => res.body)`
          : `return cy.request<${typeSchemas.response.name}>({
  ${requestOptions.join(',\n  ')}
})`}
      </Function>
    </File.Source>
  )
}

Request.getParams = getParams
