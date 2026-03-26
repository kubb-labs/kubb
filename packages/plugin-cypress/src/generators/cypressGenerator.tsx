import path from 'node:path'
import { defineGenerator } from '@kubb/core'
import { type PluginTs, pluginTsName } from '@kubb/plugin-ts'
import { File } from '@kubb/react-fabric'
import { Request } from '../components/Request.tsx'
import type { PluginCypress } from '../types'
import { buildTypeNames } from '../utils.ts'

/**
 * Default Cypress generator for `@kubb/plugin-cypress`.
 *
 * Generates `cy.request()` helper functions for each API operation.
 */
export const cypressGenerator = defineGenerator<PluginCypress>({
  name: 'cypress',
  type: 'react',
  Operation({ node, adapter, options, config, driver, resolver }) {
    const { output, baseURL, dataReturnType, paramsCasing, paramsType, pathParamsType, group } = options

    const tsPlugin = driver.getPlugin<PluginTs>(pluginTsName)
    const resolverTs = tsPlugin?.resolver

    if (!resolverTs || !tsPlugin) {
      throw new Error(`Plugin ${pluginTsName} is not defined`)
    }

    const root = path.resolve(config.root, config.output.path)

    const file = resolver.resolveFile({ name: node.operationId, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path }, { root, output, group })

    const name = resolver.resolveName(node.operationId)

    const typeNames = buildTypeNames({ node, paramsCasing, resolver: resolverTs })

    // Collect all type names that need to be imported from plugin-ts.
    // In legacy/kubbV4 mode use the grouped param types; otherwise use per-param types.
    const importedTypeNames = [
      ...(typeNames.grouped?.pathParams ? [typeNames.grouped.pathParams] : typeNames.pathParams.map((p) => p.typedName)),
      ...(typeNames.grouped?.queryParams ? [typeNames.grouped.queryParams] : typeNames.queryParams.map((p) => p.typedName)),
      ...(typeNames.grouped?.headerParams ? [typeNames.grouped.headerParams] : typeNames.headerParams.map((p) => p.typedName)),
      typeNames.requestBody?.typedName,
      typeNames.response.typedName,
    ].filter(Boolean)

    // Resolve the plugin-ts file using plugin-ts's own output/group context so the path points to
    // where plugin-ts actually writes its types (not the cypress output directory).
    const tsFile = resolverTs.resolveFile(
      { name: node.operationId, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path },
      { root, output: tsPlugin.options.output, group: tsPlugin.options.group },
    )

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
