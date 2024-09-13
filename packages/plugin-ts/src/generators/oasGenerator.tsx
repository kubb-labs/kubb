import { createReactGenerator } from '@kubb/plugin-oas'
import { useOas } from '@kubb/plugin-oas/hooks'
import { File, useApp } from '@kubb/react'
import { OasType } from '../components'
import type { PluginTs } from '../types.ts'

export const oasGenerator = createReactGenerator<PluginTs>({
  name: 'oas',
  Operations() {
    const {
      pluginManager,
      plugin: { output, key: pluginKey },
    } = useApp<PluginTs>()
    const oas = useOas()

    const file = pluginManager.getFile({ name: 'oas', extName: '.ts', pluginKey })

    return (
      <File baseName={file.baseName} path={file.path} meta={file.meta} banner={output?.banner} footer={output?.footer}>
        <File.Import name={['Infer']} path="@kubb/oas" isTypeOnly />

        <OasType name={'oas'} typeName={'Oas'} api={oas.api} />
      </File>
    )
  },
})
