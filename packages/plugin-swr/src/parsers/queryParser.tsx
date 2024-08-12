import { File, useApp } from '@kubb/react'

import { createParser } from '@kubb/plugin-oas'
import { pluginTsName } from '@kubb/plugin-ts'
import { pluginZodName } from '@kubb/plugin-zod'
import type { PluginSwr } from '../types.ts'
import { SchemaType } from '../components/SchemaType.tsx'
import { Query, QueryOptions } from '../components'

// TOOD move to zod plugin
const zodParser = createParser({
  name: 'zod',
  pluginName: pluginZodName,
})

// TOOD move to ts plugin
const typeParser = createParser({
  name: 'ts',
  pluginName: pluginTsName,
})

export const queryParser = createParser<PluginSwr>({
  name: 'query',
  pluginName: 'plugin-swr',
  templates: {
    Operation({ operation, options, getName, getFile, getSchemas }) {
      const { pluginManager } = useApp<PluginSwr>()

      const file = getFile()
      const typedSchemas = getSchemas({ parser: typeParser })
      const zodSchemas = getSchemas({ parser: zodParser, type: 'function' })
      const fileZodSchemas = getFile({ parser: zodParser })
      const fileType = getFile({ parser: typeParser })

      const name = getName({ type: 'function' })
      const typeName = getName({ type: 'type' })
      const queryOptionsName = pluginManager.resolveName({
        name: `${typeName}QueryOptions`,
        pluginKey: ['plugin-swr'],
      })

      const isQuery = typeof options.query === 'boolean' ? options.query : options.query.methods.some((method) => operation.method === method)

      if (!isQuery) {
        return null
      }

      return (
        <File baseName={file.baseName} path={file.path} meta={file.meta}>
          {options.parser === 'zod' && <File.Import extName={options.extName} name={[zodSchemas.response.name]} root={file.path} path={fileZodSchemas.path} />}
          <File.Import name="useSWR" path="swr" />
          <File.Import name={['SWRConfiguration', 'SWRResponse']} path="swr" isTypeOnly />
          <File.Import name={'client'} path={options.client.importPath} />
          <File.Import name={['ResponseConfig']} path={options.client.importPath} isTypeOnly />
          <File.Import
            extName={options.extName}
            name={[
              typedSchemas.request?.name,
              typedSchemas.response.name,
              typedSchemas.pathParams?.name,
              typedSchemas.queryParams?.name,
              typedSchemas.headerParams?.name,
              ...(typedSchemas.statusCodes?.map((item) => item.name) || []),
            ].filter(Boolean)}
            root={file.path}
            path={fileType.path}
            isTypeOnly
          />
          <File.Source>
            <SchemaType typeName={typeName} typedSchemas={typedSchemas} options={options} />
            <QueryOptions
              name={pluginManager.resolveName({
                name: `${typeName}QueryOptions`,
                pluginKey: ['plugin-swr'],
              })}
              typeName={typeName}
              operation={operation}
              typedSchemas={typedSchemas}
              zodSchemas={zodSchemas}
              options={options}
            />
            <Query name={name} typeName={typeName} typedSchemas={typedSchemas} queryOptionsName={queryOptionsName} options={options} operation={operation} />
          </File.Source>
        </File>
      )
    },
  },
})
