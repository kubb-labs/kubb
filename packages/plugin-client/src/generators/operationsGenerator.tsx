import { useDriver } from '@kubb/core/hooks'
import { createReactGenerator } from '@kubb/plugin-oas/generators'
import { useOas } from '@kubb/plugin-oas/hooks'
import { getBanner, getFooter } from '@kubb/plugin-oas/utils'
import { File } from '@kubb/react-fabric'
import { Operations } from '../components/Operations'
import type { PluginClient } from '../types'

export const operationsGenerator = createReactGenerator<PluginClient>({
  name: 'client',
  Operations({ operations, plugin }) {
    const {
      name: pluginName,
      options: { output },
    } = plugin
    const driver = useDriver()

    const oas = useOas()

    const name = 'operations'
    const file = driver.getFile({ name, extname: '.ts', pluginName })

    return (
      <File
        baseName={file.baseName}
        path={file.path}
        meta={file.meta}
        banner={getBanner({ oas, output, config: driver.config })}
        footer={getFooter({ oas, output })}
      >
        <Operations name={name} operations={operations} />
      </File>
    )
  },
})
