import { getRelativePath } from '@kubb/core/utils'
import { File, usePlugin, usePluginManager } from '@kubb/react'
import { useOas, useOperation, useOperationFile, useOperationName, useSchemas } from '@kubb/swagger/hooks'

import { FakerBuilder } from '../FakerBuilder.ts'

import type { KubbFile } from '@kubb/core'
import type { FileResolver } from '@kubb/swagger'
import type { ReactNode } from 'react'
import type { FileMeta, PluginOptions } from '../types.ts'

type Props = {
  builder: FakerBuilder
}

export function Query({
  builder,
}: Props): ReactNode {
  const { source } = builder.build()

  return (
    <>
      {source}
    </>
  )
}

type FileProps = {
  mode: KubbFile.Mode | undefined
}

Query.File = function({ mode }: FileProps): ReactNode {
  const { key: pluginKey, options } = usePlugin<PluginOptions>()
  const operation = useOperation()
  const schemas = useSchemas()
  const pluginManager = usePluginManager()
  const oas = useOas()
  const file = useOperationFile()
  const baseName = useOperationName({ type: 'type' })

  const fileResolver: FileResolver = (name, ref) => {
    // Used when a react-query type(request, response, params) has an import of a global type
    const root = pluginManager.resolvePath({ baseName, pluginKey: pluginKey, options: { tag: operation.getTags()[0]?.name } })
    // refs import, will always been created with the SwaggerTS plugin, our global type
    const resolvedTypeId = pluginManager.resolvePath({
      baseName: `${name}.ts`,
      pluginKey: ref.pluginKey || pluginKey,
      options: ref.pluginKey ? { tag: operation.getTags()[0]?.name } : undefined,
    })

    return getRelativePath(root, resolvedTypeId)
  }

  const builder = new FakerBuilder({
    fileResolver: mode === 'file' ? undefined : fileResolver,
    ...options,
  }, { oas, pluginManager })
    .add(schemas.pathParams)
    .add(schemas.queryParams)
    .add(schemas.headerParams)
    .add(schemas.response)
    .add(schemas.errors)

  const { source, imports = [] } = builder.build()

  return (
    <>
      <File<FileMeta>
        baseName={file.baseName}
        path={file.path}
        meta={file.meta}
      >
        <File.Import name={['faker']} path="@faker-js/faker" />
        {imports.map((item, index) => {
          return <File.Import key={index} {...item} />
        })}
        <File.Source>
          {source}
        </File.Source>
      </File>
    </>
  )
}
