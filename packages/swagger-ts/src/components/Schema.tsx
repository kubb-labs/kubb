import { Editor, File, usePlugin, usePluginManager } from '@kubb/react'
import { useSchemaName, useSchemaObject } from '@kubb/swagger/hooks'

import { SchemaImports } from './SchemaImports.tsx'

import type { KubbFile } from '@kubb/core'
import type { SchemaGenerator, SchemaGeneratorBuildOptions } from '@kubb/swagger'
import type { ReactNode } from 'react'
import type { FileMeta, PluginOptions } from '../types.ts'

type Props = {
  generator: SchemaGenerator
  options?: SchemaGeneratorBuildOptions
}

export function Schema({ generator, options }: Props): ReactNode {
  const name = useSchemaName()
  const schemaObject = useSchemaObject()

  if (!schemaObject) {
    return null
  }

  // TODO replace with React component
  const source = generator.buildSource(name, schemaObject, options)

  return (
    <>
      {source}
    </>
  )
}

type FileProps = {
  generator: SchemaGenerator
  mode: KubbFile.Mode | undefined
  output: string | undefined
}

Schema.File = function({ generator, output, mode = 'directory' }: FileProps): ReactNode {
  const plugin = usePlugin<PluginOptions>()

  const pluginManager = usePluginManager()
  const name = useSchemaName()

  if (mode === 'file') {
    const baseName = output as KubbFile.BaseName
    const resolvedPath = pluginManager.resolvePath({ baseName: '', pluginKey: plugin.key })

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
          <File.Source>
            <Schema generator={generator} />
          </File.Source>
        </File>
      </Editor>
    )
  }

  const baseName = `${pluginManager.resolveName({ name, pluginKey: plugin.key, type: 'file' })}.ts` as const
  const resolvedPath = pluginManager.resolvePath({ baseName, pluginKey: plugin.key })

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
        <SchemaImports generator={generator} root={resolvedPath} />
        <File.Source>
          <Schema generator={generator} />
        </File.Source>
      </File>
    </Editor>
  )
}
