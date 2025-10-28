import { usePlugin, usePluginManager } from '@kubb/core/hooks'
import { pluginFakerName } from '@kubb/plugin-faker'
import { createReactGenerator } from '@kubb/plugin-oas'
import { useOas, useOperationManager } from '@kubb/plugin-oas/hooks'
import { getBanner, getFooter } from '@kubb/plugin-oas/utils'
import { pluginTsName } from '@kubb/plugin-ts'
import { File } from '@kubb/react-fabric'
import { Mock, MockWithFaker, Response } from '../components'
import type { PluginMsw } from '../types'

export const mswGenerator = createReactGenerator<PluginMsw>({
  name: 'msw',
  Operation({ operation }) {
    const {
      options: { output, parser, baseURL },
    } = usePlugin<PluginMsw>()
    const pluginManager = usePluginManager()

    const oas = useOas()
    const { getSchemas, getName, getFile } = useOperationManager()

    const mock = {
      name: getName(operation, { type: 'function' }),
      file: getFile(operation),
    }

    const faker = {
      file: getFile(operation, { pluginKey: [pluginFakerName] }),
      schemas: getSchemas(operation, { pluginKey: [pluginFakerName], type: 'function' }),
    }

    const type = {
      file: getFile(operation, { pluginKey: [pluginTsName] }),
      schemas: getSchemas(operation, { pluginKey: [pluginTsName], type: 'type' }),
    }

    const responseStatusCodes = operation.getResponseStatusCodes()

    const types: [statusCode: number | 'default', typeName: string][] = []

    for (const code of responseStatusCodes) {
      if (code === 'default') {
        types.push(['default', type.schemas.response.name])
        continue
      }

      if (code.startsWith('2')) {
        types.push([Number(code), type.schemas.response.name])
        continue
      }

      const codeType = type.schemas.errors?.find((err) => err.statusCode === Number(code))
      if (codeType) types.push([Number(code), codeType.name])
    }

    return (
      <File
        baseName={mock.file.baseName}
        path={mock.file.path}
        meta={mock.file.meta}
        banner={getBanner({ oas, output, config: pluginManager.config })}
        footer={getFooter({ oas, output })}
      >
        <File.Import name={['http']} path="msw" />
        <File.Import name={['ResponseResolver']} isTypeOnly path="msw" />
        <File.Import
          name={Array.from(new Set([type.schemas.response.name, ...types.map((t) => t[1])]))}
          path={type.file.path}
          root={mock.file.path}
          isTypeOnly
        />
        {parser === 'faker' && faker.file && faker.schemas.response && (
          <File.Import name={[faker.schemas.response.name]} root={mock.file.path} path={faker.file.path} />
        )}

        {types
          .filter(([code]) => code !== 'default')
          .map(([code, typeName]) => (
            <Response typeName={typeName} operation={operation} name={mock.name} statusCode={code as number} />
          ))}
        {parser === 'faker' && (
          <MockWithFaker
            name={mock.name}
            typeName={type.schemas.response.name}
            fakerName={faker.schemas.response.name}
            operation={operation}
            baseURL={baseURL}
          />
        )}
        {parser === 'data' && (
          <Mock name={mock.name} typeName={type.schemas.response.name} fakerName={faker.schemas.response.name} operation={operation} baseURL={baseURL} />
        )}
      </File>
    )
  },
})
