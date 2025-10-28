import { usePlugin, usePluginManager } from '@kubb/core/hooks'
import { createReactGenerator } from '@kubb/plugin-oas'
import { useOas } from '@kubb/plugin-oas/hooks'
import { getBanner, getFooter } from '@kubb/plugin-oas/utils'
import { File } from '@kubb/react-fabric'
import { OasType } from '../components'
import type { PluginTs } from '../types.ts'

export const oasGenerator = createReactGenerator<PluginTs>({
  name: 'oas',
  Operations() {
    const {
      options: { output },
      key: pluginKey,
    } = usePlugin<PluginTs>()
    const pluginManager = usePluginManager()
    const oas = useOas()

    const file = pluginManager.getFile({ name: 'oas', extname: '.ts', pluginKey })

    return (
      <File
        baseName={file.baseName}
        path={file.path}
        meta={file.meta}
        banner={getBanner({ oas, output, config: pluginManager.config })}
        footer={getFooter({ oas, output })}
      >
        <File.Import name={['Infer']} path="@kubb/oas" isTypeOnly />

        <OasType name={'oas'} typeName={'Oas'} api={oas.api} />
      </File>
    )
  },
})
