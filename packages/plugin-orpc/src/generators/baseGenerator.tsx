import { usePluginManager } from '@kubb/core/hooks'
import { createReactGenerator } from '@kubb/plugin-oas/generators'
import { useOas } from '@kubb/plugin-oas/hooks'
import { getBanner, getFooter } from '@kubb/plugin-oas/utils'
import { File } from '@kubb/react-fabric'
import type { PluginOrpc } from '../types.ts'

export const baseGenerator = createReactGenerator<PluginOrpc>({
  name: 'base',
  Operations({ plugin }) {
    const {
      key: pluginKey,
      options: { output, importPath },
    } = plugin

    const pluginManager = usePluginManager()
    const oas = useOas()

    const file = pluginManager.getFile({ name: 'base', extname: '.ts', pluginKey })

    return (
      <File
        baseName={file.baseName}
        path={file.path}
        meta={file.meta}
        banner={getBanner({ oas, output, config: pluginManager.config })}
        footer={getFooter({ oas, output })}
      >
        <File.Import name={['oc']} path={importPath} />
        <File.Source name="base" isExportable isIndexable>
          {`export const base = oc.$route({ inputStructure: 'detailed' })`}
        </File.Source>
      </File>
    )
  },
})
