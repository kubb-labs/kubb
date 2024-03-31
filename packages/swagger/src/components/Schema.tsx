import { Editor, File, createContext, useFile, usePlugin, usePluginManager } from '@kubb/react'

import { schemaKeywords } from '../SchemaMapper.ts'
import { useSchema } from '../hooks/useSchema.ts'

import type { KubbFile } from '@kubb/core'
import type { KubbNode } from '@kubb/react'
import type { ReactNode } from 'react'
import type { SchemaGenerator, SchemaGeneratorBuildOptions } from '../SchemaGenerator.ts'
import type { Schema as SchemaType } from '../SchemaMapper.ts'
import type { SchemaObject } from '../oas/index.ts'
import type { PluginOptions } from '../types.ts'

export type SchemaContextProps = {
  name: string
  object?: SchemaObject
  generator?: SchemaGenerator
  schemas: SchemaType[]
}

type Props = {
  name: string
  object?: SchemaObject
  generator: SchemaGenerator<any, any, any>
  children?: KubbNode
}

const SchemaContext = createContext<SchemaContextProps>({
  name: 'unknown',
  schemas: [],
})

export function Schema({ name, object, generator, children }: Props): KubbNode {
  const schemas = generator.buildSchemas(object, name)

  return <SchemaContext.Provider value={{ name, schemas, object, generator }}>{children}</SchemaContext.Provider>
}

type FileProps = {
  mode: KubbFile.Mode | undefined
  isTypeOnly?: boolean
  output: string | undefined
  children?: KubbNode
}

Schema.File = function ({ output, isTypeOnly, children, mode = 'directory' }: FileProps): ReactNode {
  const plugin = usePlugin<PluginOptions>()

  const pluginManager = usePluginManager()
  const { name } = useSchema()

  if (mode === 'file') {
    const baseName = output as KubbFile.BaseName
    const resolvedPath = pluginManager.resolvePath({
      baseName: '',
      pluginKey: plugin.key,
    })

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
          {children}
        </File>
      </Editor>
    )
  }

  const baseName = `${pluginManager.resolveName({
    name,
    pluginKey: plugin.key,
    type: 'file',
  })}.ts` as const
  const resolvedPath = pluginManager.resolvePath({
    baseName,
    pluginKey: plugin.key,
  })

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
        <Schema.Imports isTypeOnly={isTypeOnly} />
        <File.Source>
          <Schema.Source />
        </File.Source>
        {children}
      </File>
    </Editor>
  )
}

type SchemaImportsProps = {
  isTypeOnly?: boolean
}

Schema.Imports = ({ isTypeOnly }: SchemaImportsProps): ReactNode => {
  const { generator, schemas } = useSchema()
  const { path: root } = useFile()

  const refs = generator.deepSearch(schemas, schemaKeywords.ref)

  return (
    <>
      {refs
        ?.map((item, i) => {
          if (!item.args.path) {
            return undefined
          }
          return <File.Import key={i} root={root} name={[item.args.name]} path={item.args.path} isTypeOnly={item.args.isTypeOnly ?? isTypeOnly} />
        })
        .filter(Boolean)}
    </>
  )
}

type SchemaSourceProps<TOptions extends SchemaGeneratorBuildOptions = SchemaGeneratorBuildOptions> = {
  extraSchemas?: SchemaType[]
  options?: TOptions
}

Schema.Source = <TOptions extends SchemaGeneratorBuildOptions = SchemaGeneratorBuildOptions>({
  options,
  extraSchemas = [],
}: SchemaSourceProps<TOptions>): ReactNode => {
  const { name, generator, schemas } = useSchema()

  const source = generator.getSource(name, [...schemas, ...extraSchemas], options as SchemaGeneratorBuildOptions)

  return (
    <>
      {source}
      <br />
    </>
  )
}
Schema.Context = SchemaContext
