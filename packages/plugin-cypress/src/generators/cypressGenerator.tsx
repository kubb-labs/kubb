import path from 'node:path'
import { caseParams } from '@kubb/ast'
import { defineGenerator } from '@kubb/core'
import type { PluginTs } from '@kubb/plugin-ts'
import { pluginTsName } from '@kubb/plugin-ts'
import { File } from '@kubb/react-fabric'
import { Request } from '../components/Request.tsx'
import type { PluginCypress } from '../types.ts'

export const cypressGenerator = defineGenerator<PluginCypress>({
  name: 'cypress',
  type: 'react',
  Operation({ node, adapter, options, config, driver, resolver }) {
    const { output, baseURL, dataReturnType, paramsCasing, paramsType, pathParamsType, group } = options
    const root = path.resolve(config.root, config.output.path)

    const pluginTs = driver.getPlugin<PluginTs>(pluginTsName)

    if (!pluginTs) {
      return null
    }

    const file = resolver.resolveFile({ name: node.operationId, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path }, { root, output, group })
    const tsFile = pluginTs.resolver.resolveFile(
      { name: node.operationId, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path },
      {
        root,
        output: pluginTs.options?.output ?? output,
        group: pluginTs.options?.group,
      },
    )

    const name = resolver.resolveName(node.operationId)

    const casedParams = caseParams(node.parameters, paramsCasing)
    const tsResolver = pluginTs.resolver

    const pathParams = casedParams.filter((p) => p.in === 'path')
    const queryParams = casedParams.filter((p) => p.in === 'query')
    const headerParams = casedParams.filter((p) => p.in === 'header')

    const importedTypeNames = [
      // Use group names when the resolver provides them, otherwise individual names
      ...(pathParams.length && tsResolver.resolvePathParamsName
        ? [tsResolver.resolvePathParamsName(node, pathParams[0]!)]
        : pathParams.map((p) => tsResolver.resolveParamName(node, p))),
      ...(queryParams.length && tsResolver.resolveQueryParamsName
        ? [tsResolver.resolveQueryParamsName(node, queryParams[0]!)]
        : queryParams.map((p) => tsResolver.resolveParamName(node, p))),
      ...(headerParams.length && tsResolver.resolveHeaderParamsName
        ? [tsResolver.resolveHeaderParamsName(node, headerParams[0]!)]
        : headerParams.map((p) => tsResolver.resolveParamName(node, p))),
      node.requestBody?.schema ? tsResolver.resolveDataName(node) : undefined,
      tsResolver.resolveResponseName(node),
    ].filter(Boolean)

    return (
      <File
        baseName={file.baseName}
        path={file.path}
        meta={file.meta}
        banner={resolver.resolveBanner(adapter.rootNode, { output, config })}
        footer={resolver.resolveFooter(adapter.rootNode, { output, config })}
      >
        {tsFile && importedTypeNames.length > 0 && <File.Import name={Array.from(new Set(importedTypeNames))} root={file.path} path={tsFile.path} isTypeOnly />}
        <Request
          name={name}
          node={node}
          resolver={tsResolver}
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
