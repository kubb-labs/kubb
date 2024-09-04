import { pluginFakerName } from '@kubb/plugin-faker'
import { createReactGenerator } from '@kubb/plugin-oas'
import { useOperationManager } from '@kubb/plugin-oas/hooks'
import { pluginTsName } from '@kubb/plugin-ts'
import { File, useApp } from '@kubb/react'
import { Mock } from '../components'
import type { PluginMsw } from '../types'

export const mockGenerator = createReactGenerator<PluginMsw>({
  name: 'plugin-msw',
  Operation({ operation }) {
    const { pluginManager, plugin } = useApp<PluginMsw>()
    const { getSchemas, getName, getFile } = useOperationManager()

    const name = getName(operation, { type: 'function' })
    const file = getFile(operation)
    const fakerFile = getFile(operation, { pluginKey: [pluginFakerName] })
    const fakerSchemas = getSchemas(operation, { pluginKey: [pluginTsName] })

    const responseName = pluginManager.resolveName({
      pluginKey: [pluginFakerName],
      name: fakerSchemas.response.name,
      type: 'function',
    })

    return (
      <File baseName={file.baseName} path={file.path} meta={file.meta}>
        <File.Import name={['http']} path={'msw'} />
        {fakerFile && responseName && <File.Import extName={plugin.output?.extName} name={[responseName]} root={file.path} path={fakerFile.path} />}

        <Mock name={name} responseName={responseName} operation={operation} />
      </File>
    )
  },
})
