import { useApp } from '@kubb/core/hooks'
import { createReactGenerator } from '@kubb/plugin-oas/generators'

import { File } from '@kubb/react-fabric'

import { Type } from '../../components/v2/Type.tsx'
import type { PluginTs } from '../../types'

export const typeGenerator = createReactGenerator<PluginTs, '2'>({
  name: 'typescript',
  version: '2',
  Schema({ node, adapter, plugin }) {
    const {
      options: { mapper, enumType, enumKeyCasing, syntaxType, optionalType, arrayType },
    } = plugin
    const { mode, resolveName, getFile } = useApp<PluginTs>()

    if (!node.name) {
      return
    }

    const imports = adapter.getImports(node, (schemaName) => ({
      name: resolveName({
        name: schemaName,
        pluginName: plugin.name,
        type: 'type',
      }),
      path: getFile({
        name: schemaName,
        pluginName: plugin.name,
        extname: '.ts',
        mode,
        // options: {
        //   group
        // },
      }).path,
    }))

    const isEnumSchema = node.type === 'enum'

    let typedName = resolveName({
      name: node.name,
      pluginName: plugin.name,
      type: 'type',
    })

    if (['asConst', 'asPascalConst'].includes(enumType) && isEnumSchema) {
      typedName = typedName += 'Key'
    }

    const type = {
      name: resolveName({
        name: node.name,
        pluginName: plugin.name,
        type: 'function',
      }),
      typedName,
      file: getFile({
        name: node.name,
        pluginName: plugin.name,
        extname: '.ts',
        mode,
        // options: {
        //   group
        // },
      }),
    } as const

    return (
      <File baseName={type.file.baseName} path={type.file.path} meta={type.file.meta}>
        {mode === 'split' &&
          imports.map((imp) => (
            <File.Import key={[node.name, imp.path, imp.isTypeOnly].join('-')} root={type.file.path} path={imp.path} name={imp.name} isTypeOnly />
          ))}

        <Type
          name={type.name}
          typedName={type.typedName}
          node={node}
          mapper={mapper}
          enumType={enumType}
          enumKeyCasing={enumKeyCasing}
          optionalType={optionalType}
          arrayType={arrayType}
          syntaxType={syntaxType}
        />
      </File>
    )
  },
})
