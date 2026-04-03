import { caseParams } from '@kubb/ast'
import { defineGenerator } from '@kubb/core'
import { pluginTsName } from '@kubb/plugin-ts'
import { File } from '@kubb/react-fabric'
import { Request } from '../components/Request.tsx'
import type { PluginCypress } from '../types.ts'

export const cypressGenerator = defineGenerator<PluginCypress>({
  name: 'cypress',
  operation(node, options) {
    const { adapter, config, resolver, driver, root } = this
    const { output, baseURL, dataReturnType, paramsCasing, paramsType, pathParamsType, group } = options

    const pluginTs = driver.getPlugin(pluginTsName)

    if (!pluginTs?.resolver) {
      return null
    }

    const casedParams = caseParams(node.parameters, paramsCasing)

    const pathParams = casedParams.filter((p) => p.in === 'path')
    const queryParams = casedParams.filter((p) => p.in === 'query')
    const headerParams = casedParams.filter((p) => p.in === 'header')

    const importedTypeNames = [
      ...pathParams.map((p) => pluginTs.resolver.resolvePathParamsName(node, p)),
      ...queryParams.map((p) => pluginTs.resolver.resolveQueryParamsName(node, p)),
      ...headerParams.map((p) => pluginTs.resolver.resolveHeaderParamsName(node, p)),
      node.requestBody?.schema ? pluginTs.resolver.resolveDataName(node) : undefined,
      pluginTs.resolver.resolveResponseName(node),
    ].filter(Boolean)

    const meta = {
      name: resolver.resolveName(node.operationId),
      file: resolver.resolveFile({ name: node.operationId, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path }, { root, output, group }),
      fileTs: pluginTs.resolver.resolveFile(
        { name: node.operationId, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path },
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
          node={node}
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
