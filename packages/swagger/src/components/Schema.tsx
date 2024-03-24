import { createContext, Editor, File, usePlugin, usePluginManager } from '@kubb/react'

import { useSchema } from '../hooks/useSchema.ts'
import { schemaKeywords } from '../SchemaMapper.ts'

import type { KubbFile } from '@kubb/core'
import type { KubbNode } from '@kubb/react'
import type { ReactNode } from 'react'
import type { Operation as OperationType, SchemaObject } from '../oas/index.ts'
import type { SchemaGenerator, SchemaGeneratorBuildOptions } from '../SchemaGenerator.ts'
import type { PluginOptions } from '../types.ts'

export type SchemaContextProps = {
  name: string
  object?: SchemaObject
  generator?: SchemaGenerator
  operation?: OperationType
}

type Props = {
  name: string
  object?: SchemaObject
  generator: SchemaGenerator
  children?: KubbNode
}

const SchemaContext = createContext<SchemaContextProps>({ name: 'unknown' })

export function Schema({ name, object, generator, children }: Props): KubbNode {
  return (
    <SchemaContext.Provider value={{ name, object, generator }}>
      {children}
    </SchemaContext.Provider>
  )
}

type FileProps = {
  mode: KubbFile.Mode | undefined
  isTypeOnly?: boolean
  output: string | undefined
}

Schema.File = function({ output, isTypeOnly, mode = 'directory' }: FileProps): ReactNode {
  const plugin = usePlugin<PluginOptions>()

  const pluginManager = usePluginManager()
  const { name } = useSchema()

  if (mode === 'file') {
    const baseName = output as KubbFile.BaseName
    const resolvedPath = pluginManager.resolvePath({ baseName: '', pluginKey: plugin.key })

    if (!resolvedPath) {
      return null
    }

    return (
      <Editor language="typescript">
        <File
          baseName={baseName}
          path={resolvedPath}
          meta={{
            pluginKey: plugin.key,
          }}
        >
          <File.Source>
            <Schema.Source />
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
      <File
        baseName={baseName}
        path={resolvedPath}
        meta={{
          pluginKey: plugin.key,
        }}
      >
        <Schema.Imports isTypeOnly={isTypeOnly} root={resolvedPath} />
        <File.Source>
          <Schema.Source />
        </File.Source>
      </File>
    </Editor>
  )
}

type SchemaImportsProps = {
  root: string
  isTypeOnly?: boolean
}

Schema.Imports = ({ root, isTypeOnly }: SchemaImportsProps): ReactNode => {
  const { name, object, generator } = useSchema()

  // TODO replace with React component
  const schemas = generator?.buildSchemas(object, name)
  const refs = generator?.deepSearch(schemas, schemaKeywords.ref)

  return (
    <>
      {refs?.map((ref, i) => {
        if (!ref.args.path) {
          return undefined
        }
        return <File.Import key={i} root={root} name={[ref.args.name]} path={ref.args.path} isTypeOnly={isTypeOnly} />
      }).filter(Boolean)}
    </>
  )
}

type SchemaSourceProps = {
  options?: SchemaGeneratorBuildOptions
}

Schema.Source = ({ options }: SchemaSourceProps): ReactNode => {
  const { name, object, generator } = useSchema()

  // TODO replace with React component
  const source = generator?.buildSource(name, object, options)

  return (
    <>
      {source}
      <br />
    </>
  )
}
Schema.Context = SchemaContext
