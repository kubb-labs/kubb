/* eslint-disable no-empty-pattern */
/* eslint-disable @typescript-eslint/ban-types */
import { Editor, File, usePlugin, usePluginManager } from '@kubb/react'
import { schemaKeywords } from '@kubb/swagger'
import { useSchemaName, useSchemaObject } from '@kubb/swagger/hooks'

import type { KubbFile } from '@kubb/core'
import type { ReactNode } from 'react'
import type { SchemaGenerator } from '../SchemaGenerator.tsx'
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
  output: string | undefined
}

Schema.File = function({ generator, output, mode = 'directory' }: FileProps): ReactNode {
  const plugin = usePlugin<PluginOptions>()

  const pluginManager = usePluginManager()
  const name = useSchemaName()
  const schemaObject = useSchemaObject()

  // TODO replace with React component
  const source = generator.buildSource(name, schemaObject)

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
            {source}
          </File.Source>
        </File>
      </Editor>
    )
  }

  const baseName = `${pluginManager.resolveName({ name, pluginKey: plugin.key, type: 'file' })}.ts` as const
  const resolvedPath = pluginManager.resolvePath({ baseName, pluginKey: plugin.key })
  const schemas = generator.buildSchemas(schemaObject, name)

  const refs = generator.deepSearch(schemas, schemaKeywords.ref)

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
        {refs.map((ref, i) => {
          if (!ref.args.path) {
            return undefined
          }
          return <File.Import key={i} root={resolvedPath} name={[ref.args.name]} path={ref.args.path} isTypeOnly />
        }).filter(Boolean)}
        <File.Source>
          {source}
        </File.Source>
      </File>
    </Editor>
  )
}
