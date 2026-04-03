import { caseParams, transform } from '@kubb/ast'
import { defineGenerator } from '@kubb/core'
import { pluginTsName } from '@kubb/plugin-ts'
import { File } from '@kubb/react-fabric'
import { Request } from '../components/Request.tsx'
import type { PluginCypress } from '../types.ts'

export const cypressGenerator = defineGenerator<PluginCypress>({
  name: 'cypress',
  operation(node, options) {
    const { adapter, config, resolver, plugin, driver, root } = this
    const { output, baseURL, dataReturnType, paramsCasing, paramsType, pathParamsType, group } = options

    const pluginTs = driver.getPlugin(pluginTsName)

    if (!pluginTs?.resolver) {
      return null
    }

    const transformedNode = plugin.transformer ? transform(node, plugin.transformer) : node

    const casedParams = caseParams(transformedNode.parameters, paramsCasing)

    const pathParams = casedParams.filter((p) => p.in === 'path')
    const queryParams = casedParams.filter((p) => p.in === 'query')
    const headerParams = casedParams.filter((p) => p.in === 'header')

    const importedTypeNames = [
      ...pathParams.map((p) => pluginTs.resolver.resolvePathParamsName(transformedNode, p)),
      ...queryParams.map((p) => pluginTs.resolver.resolveQueryParamsName(transformedNode, p)),
      ...headerParams.map((p) => pluginTs.resolver.resolveHeaderParamsName(transformedNode, p)),
      transformedNode.requestBody?.schema ? pluginTs.resolver.resolveDataName(transformedNode) : undefined,
      pluginTs.resolver.resolveResponseName(transformedNode),
    ].filter(Boolean)

    const meta = {
      name: resolver.resolveName(transformedNode.operationId),
      file: resolver.resolveFile(
        { name: transformedNode.operationId, extname: '.ts', tag: transformedNode.tags[0] ?? 'default', path: transformedNode.path },
        { root, output, group },
      ),
      fileTs: pluginTs.resolver.resolveFile(
        { name: transformedNode.operationId, extname: '.ts', tag: transformedNode.tags[0] ?? 'default', path: transformedNode.path },
        {
          root,
          output: pluginTs.options?.output ?? output,
          group: pluginTs.options?.group,
        },
      ),
    } as const

    return (
      <File
        baseName={meta.file.baseName}
        path={meta.file.path}
        meta={meta.file.meta}
        banner={resolver.resolveBanner(adapter.rootNode, { output, config })}
        footer={resolver.resolveFooter(adapter.rootNode, { output, config })}
      >
        {meta.fileTs && importedTypeNames.length > 0 && (
          <File.Import name={Array.from(new Set(importedTypeNames))} root={meta.file.path} path={meta.fileTs.path} isTypeOnly />
        )}
        <Request
          name={meta.name}
          node={transformedNode}
          resolver={pluginTs.resolver}
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
