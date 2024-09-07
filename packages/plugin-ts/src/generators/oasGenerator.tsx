import { createReactGenerator } from '@kubb/plugin-oas'
import { useOas } from '@kubb/plugin-oas/hooks'
import { File, useApp } from '@kubb/react'
import type { PluginTs } from '../types.ts'
import { OasType } from '../components'

export const oasGenerator = createReactGenerator<PluginTs>({
  name: 'oas',
  Operations() {
    const { pluginManager, plugin } = useApp<PluginTs>()
    const oas = useOas()

    const file = pluginManager.getFile({ name: 'oas', extName: '.ts', pluginKey: plugin.key })

    return (
      <File baseName={file.baseName} path={file.path} meta={file.meta}>
        <File.Import name={['Infer']} path="@kubb/oas" isTypeOnly />

        <OasType name={'oas'} typeName={'Oas'} api={oas.api} />
      </File>
    )
  },
})
