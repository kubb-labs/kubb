/* eslint-disable no-empty-pattern */
/* eslint-disable @typescript-eslint/ban-types */
import { File, Editor, usePlugin, usePluginManager } from '@kubb/react'
import { useOas, useSchema, useSchemaName } from '@kubb/swagger/hooks'

import { SchemaGenerator } from '../SchemaGenerator.tsx'

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
  generator: SchemaGenerator
  mode: KubbFile.Mode | undefined
}

Schema.File = function({ generator, mode = 'directory' }: FileProps): ReactNode {
  const plugin = usePlugin<PluginOptions>()

  const pluginManager = usePluginManager()
  const name = useSchemaName()
  const schema = useSchema()

  if (mode === 'directory') {
    const baseName = `${pluginManager.resolveName({ name, pluginKey: plugin.key, type: 'file' })}.ts` as const
    const resolvedPath = pluginManager.resolvePath({ baseName, pluginKey: plugin.key })
    // TODO replace with React component
    const source = generator.buildSchema(name, schema)

    console.log(source)

    if (!resolvedPath) {
      return null
    }

    return (
      <Editor language="typescript">
        <File<FileMeta>
          baseName={baseName}
          path={resolvedPath}
          meta={{
            pluginKey: plugin.key,
          }}
        >
          {source}
        </File>
      </Editor>
    )
  }

  return null
  // return (
  //   <Editor language="typescript">
  //     <File<FileMeta>
  //       baseName={file.baseName}
  //       path={file.path}
  //       meta={file.meta}
  //     >
  //       <File.Import name={['z']} path="zod" />
  //       <OasParser
  //         name={undefined}
  //         items={items}
  //         mode={mode}
  //         generator={generator}
  //         isTypeOnly
  //       />
  //     </File>
  //   </Editor>
  // )
}
