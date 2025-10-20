import { pluginFakerName } from '@kubb/plugin-faker'
import { createReactGenerator } from '@kubb/plugin-oas'
import { useOas, useOperationManager } from '@kubb/plugin-oas/hooks'
import { getBanner, getFooter } from '@kubb/plugin-oas/utils'
import { pluginTsName } from '@kubb/plugin-ts'
import { File, useApp } from '@kubb/react'
import { Mock, MockWithFaker, Response } from '../components'
import type { PluginMsw } from '../types'

export const mswGenerator = createReactGenerator<PluginMsw>({
  name: 'msw',
  Operation({ operation }) {
    const {
      pluginManager,
      plugin: {
        options: { output, parser, baseURL },
      },
    } = useApp<PluginMsw>()
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

    const types = [
      type.schemas.response.name,
      ...(type.schemas.errors?.map((error) => error.name) ?? []),
    ]

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
        <File.Import name={types} path={type.file.path} root={mock.file.path} isTypeOnly />
        {parser === 'faker' && faker.file && faker.schemas.response && (
          <File.Import name={[faker.schemas.response.name]} root={mock.file.path} path={faker.file.path} />
        )}

        {responseStatusCodes.map((code) => (
          <Response typeName={code} operation={operation} name={mock.name} statusCode={code} />
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
