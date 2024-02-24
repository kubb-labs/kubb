import { File, usePlugin, usePluginManager } from '@kubb/react'
import { useOas, useOperationFile, useSchemas } from '@kubb/swagger/hooks'

import { ZodBuilder } from '../ZodBuilder.ts'

import type { KubbFile } from '@kubb/core'
import type { ReactNode } from 'react'
import type { FileMeta, PluginOptions } from '../types.ts'

type Props = {
  builder: ZodBuilder
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
  mode: KubbFile.Mode
}

Query.File = function({ mode }: FileProps): ReactNode {
  const { options } = usePlugin<PluginOptions>()

  const schemas = useSchemas()
  const pluginManager = usePluginManager()
  const oas = useOas()
  const file = useOperationFile()

  const builder = new ZodBuilder(options, { oas, pluginManager })
    .add(schemas.pathParams)
    .add(schemas.queryParams)
    .add(schemas.headerParams)
    .add(schemas.response)
    .add(schemas.statusCodes)

  const { source, imports } = builder.build()

  return (
    <>
      <File<FileMeta>
        baseName={file.baseName}
        path={file.path}
        meta={file.meta}
      >
        <File.Import name={['z']} path="zod" />
        {mode === 'directory' && imports.map((item, index) => {
          return <File.Import key={index} root={file.path} {...item} />
        })}
        <File.Source>
          {source}
        </File.Source>
      </File>
    </>
  )
}
