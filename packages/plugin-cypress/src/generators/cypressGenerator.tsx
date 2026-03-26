import path from 'node:path'
import { caseParams } from '@kubb/ast'
import type { OperationNode, ParameterNode } from '@kubb/ast/types'
import { defineGenerator } from '@kubb/core'
import { useDriver } from '@kubb/core/hooks'
import { resolverTs } from '@kubb/plugin-ts/resolvers'
import { pluginTsName } from '@kubb/plugin-ts'
import { File } from '@kubb/react-fabric'
import { Request, type TypeNames } from '../components'
import type { PluginCypress } from '../types'

/**
 * Computes the pre-resolved type name info for a given operation node,
 * delegating to the plugin-ts resolver for type names.
 */
function buildTypeNames(node: OperationNode, paramsCasing: PluginCypress['resolvedOptions']['paramsCasing']): TypeNames {
  const casedParams = caseParams(node.parameters, paramsCasing)

  const pathParams = casedParams
    .filter((p): p is ParameterNode & { in: 'path' } => p.in === 'path')
    .map((param, i) => {
      const originalParam = node.parameters.filter((p) => p.in === 'path')[i]!
      return {
        name: param.name,
        typedName: resolverTs.resolveParamTypedName(node, originalParam),
        required: param.required,
      }
    })

  const queryParams = casedParams
    .filter((p): p is ParameterNode & { in: 'query' } => p.in === 'query')
    .map((param, i) => {
      const originalParam = node.parameters.filter((p) => p.in === 'query')[i]!
      return {
        name: param.name,
        typedName: resolverTs.resolveParamTypedName(node, originalParam),
        required: param.required,
      }
    })

  const headerParams = casedParams
    .filter((p): p is ParameterNode & { in: 'header' } => p.in === 'header')
    .map((param, i) => {
      const originalParam = node.parameters.filter((p) => p.in === 'header')[i]!
      return {
        name: param.name,
        typedName: resolverTs.resolveParamTypedName(node, originalParam),
        required: param.required,
      }
    })

  const requestBody = node.requestBody?.schema
    ? {
        typedName: resolverTs.resolveDataTypedName(node),
      }
    : undefined

  const response = {
    typedName: resolverTs.resolveResponseTypedName(node),
  }

  return { pathParams, queryParams, headerParams, requestBody, response }
}

/**
 * Default Cypress generator for `@kubb/plugin-cypress`.
 *
 * Generates `cy.request()` helper functions for each API operation.
 */
export const cypressGenerator = defineGenerator<PluginCypress>({
  name: 'cypress',
  type: 'react',
  Operation({ node, adapter, options, config }) {
    const { output, baseURL, dataReturnType, paramsCasing, paramsType, pathParamsType, group, resolver } = options
    const driver = useDriver()

    const root = path.resolve(config.root, config.output.path)

    const file = resolver.resolveFile({ name: node.operationId, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path }, { root, output, group })

    const name = resolver.resolveName(node.operationId)

    const typeNames = buildTypeNames(node, paramsCasing)

    // Collect all type names that need to be imported from plugin-ts
    const importedTypeNames = [
      ...typeNames.pathParams.map((p) => p.typedName),
      ...typeNames.queryParams.map((p) => p.typedName),
      ...typeNames.headerParams.map((p) => p.typedName),
      typeNames.requestBody?.typedName,
      typeNames.response.typedName,
    ].filter((n): n is string => Boolean(n))

    // Get the plugin-ts file path via the driver (cross-plugin file reference)
    const tsFileName = driver.resolveName({ name: node.operationId, pluginName: pluginTsName, type: 'file' })
    const tsFile = driver.getFile({
      name: tsFileName,
      extname: '.ts',
      pluginName: pluginTsName,
      options: { group: { tag: node.tags[0], path: node.path } },
    })

    return (
      <File
        baseName={file.baseName}
        path={file.path}
        meta={file.meta}
        banner={resolver.resolveBanner(adapter.rootNode, { output, config })}
        footer={resolver.resolveFooter(adapter.rootNode, { output, config })}
      >
        <File.Import name={Array.from(new Set(importedTypeNames))} root={file.path} path={tsFile.path} isTypeOnly />
        <Request
          name={name}
          node={node}
          typeNames={typeNames}
          dataReturnType={dataReturnType}
          paramsCasing={paramsCasing}
          paramsType={paramsType}
          pathParamsType={pathParamsType}
          baseURL={baseURL}
        />
      </File>
    )
  },
})
