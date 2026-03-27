import path from 'node:path'
import { defineGenerator } from '@kubb/core'
import type { PluginTs, ResolverTs } from '@kubb/plugin-ts'
import { pluginTsName } from '@kubb/plugin-ts'
import { File } from '@kubb/react-fabric'
import { Request } from '../components/Request.tsx'
import type { PluginCypress } from '../types.ts'
import { buildTypeNames } from '../utils.ts'

export const cypressGenerator = defineGenerator<PluginCypress>({
  name: 'cypress',
  type: 'react',
  Operation({ node, adapter, options, config, driver, resolver }) {
    const { output, baseURL, dataReturnType, paramsCasing, paramsType, pathParamsType, group } = options
    const root = path.resolve(config.root, config.output.path)

    const pluginTs = driver.getPlugin<PluginTs>(pluginTsName)
    const tsResolver = pluginTs?.resolver as ResolverTs | undefined

    const file = resolver.resolveFile({ name: node.operationId, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path }, { root, output, group })

    const name = resolver.resolveName(node.operationId)

    const typeNames = tsResolver
      ? buildTypeNames({ node, paramsCasing, resolver: tsResolver })
      : {
          pathParams: [],
          queryParams: [],
          headerParams: [],
          response: { typedName: 'unknown' },
        }

    const importedTypeNames = [
      ...typeNames.pathParams.map((p) => p.typedName),
      ...typeNames.queryParams.map((p) => p.typedName),
      ...typeNames.headerParams.map((p) => p.typedName),
      typeNames.requestBody?.typedName,
      typeNames.response.typedName,
    ].filter((n): n is string => Boolean(n) && n !== 'unknown')

    const tsFile = tsResolver?.resolveFile(
      { name: node.operationId, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path },
      {
        root: pluginTs ? path.resolve(config.root, config.output.path) : root,
        output: pluginTs?.options?.output ?? output,
        group: pluginTs?.options?.group,
      },
    )

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
