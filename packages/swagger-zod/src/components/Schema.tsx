/* eslint-disable no-empty-pattern */
/* eslint-disable @typescript-eslint/ban-types */
import { Editor, File, usePlugin, usePluginManager } from '@kubb/react'
import { OasParser } from '@kubb/swagger/components'
import { useGetOperationFile, useOas, useSchemas } from '@kubb/swagger/hooks'

import { ZodGenerator } from '../ZodGenerator.ts'

import type { KubbFile } from '@kubb/core'
import type { ReactNode } from 'react'
import type { FileMeta, PluginOptions } from '../types.ts'

type Props = {}

export function Schema({}: Props): ReactNode {
  return (
    <>
    </>
  )
}

type FileProps = {
  mode: KubbFile.Mode | undefined
}

Schema.File = function({ mode = 'directory' }: FileProps): ReactNode {
  const plugin = usePlugin<PluginOptions>()

  const pluginManager = usePluginManager()
  const oas = useOas()
  const schemas = useSchemas()
  const file = useGetOperationFile()

  const generator = new ZodGenerator(plugin.options, { oas, plugin, pluginManager })

  const items = [
    schemas.pathParams,
    schemas.queryParams,
    schemas.headerParams,
    schemas.response,
    schemas.request,
    schemas.statusCodes,
  ].flat().filter(Boolean)

  return (
    <Editor language="typescript">
      <File<FileMeta>
        baseName={file.baseName}
        path={file.path}
        meta={file.meta}
      >
        <File.Import name={['z']} path="zod" />
        <OasParser
          name={undefined}
          items={items}
          mode={mode}
          generator={generator}
        />
      </File>
    </Editor>
  )
}