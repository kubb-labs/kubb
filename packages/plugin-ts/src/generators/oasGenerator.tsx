import { createReactGenerator } from '@kubb/plugin-oas'
import { useOas } from '@kubb/plugin-oas/hooks'
import { getBanner, getFooter } from '@kubb/plugin-oas/utils'
import { File, useApp } from '@kubb/react'
import { OasType } from '../components'
import type { PluginTs } from '../types.ts'

export const oasGenerator = createReactGenerator<PluginTs>({
  name: 'oas',
  Operations() {
    const {
      pluginManager,
      plugin: {
        options: { output },
        key: pluginKey,
      },
    } = useApp<PluginTs>()
    const oas = useOas()

    const file = pluginManager.getFile({ name: 'oas', extname: '.ts', pluginKey })

    return (
      <File baseName={file.baseName} path={file.path} meta={file.meta} banner={getBanner({ oas, output, config: pluginManager.config })} footer={getFooter({ oas, output })}>
        <File.Import name={['Infer']} path="@kubb/oas" isTypeOnly />

        <OasType name={'oas'} typeName={'Oas'} api={oas.api} />
      </File>
    )
  },
})
