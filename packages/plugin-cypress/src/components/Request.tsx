import { URLPath } from '@kubb/core/utils'
import { type HttpMethod, isOptional } from '@kubb/oas'
import type { OperationSchemas } from '@kubb/plugin-oas'
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
  method: HttpMethod
}

export function Request({ baseURL = '', name, dataReturnType, typeSchemas, url, method }: Props): KubbNode {
  const params = FunctionParams.factory({
    data: typeSchemas.request?.name
      ? {
          type: typeSchemas.request?.name,
          optional: isOptional(typeSchemas.request?.schema),
        }
      : undefined,
  })

  const returnType =
    dataReturnType === 'data' ? `Cypress.Chainable<${typeSchemas.response.name}>` : `Cypress.Chainable<Cypress.Response<${typeSchemas.response.name}>>`

  const body = typeSchemas.request?.name ? 'data' : undefined

  return (
    <File.Source name={name} isIndexable isExportable>
      <Function name={name} export params={params.toConstructor()} returnType={returnType}>
        {dataReturnType === 'data' &&
          `return cy.request('${method}', '${baseURL ?? ''}${new URLPath(url).toURLPath().replace(/([^/]):/g, '$1\\\\:')}', ${body}).then((res: Cypress.Response<${typeSchemas.response.name}>) => res.body)`}
        {dataReturnType === 'full' && `return cy.request('${method}', '${new URLPath(`${baseURL ?? ''}${url}`).toURLPath()}', ${body})`}
      </Function>
    </File.Source>
  )
}
