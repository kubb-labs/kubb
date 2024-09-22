import { File, Parser, createContext, useApp, useFile } from '@kubb/react'

import { schemaKeywords } from '../SchemaMapper.ts'
import { useSchema } from '../hooks/useSchema.ts'

import type * as KubbFile from '@kubb/fs/types'
import type { SchemaObject } from '@kubb/oas'
import type { KubbNode } from '@kubb/react'
import type { ReactNode } from 'react'
import { SchemaGenerator } from '../SchemaGenerator.ts'
import type { Schema as SchemaType } from '../SchemaMapper.ts'
import type { PluginOas } from '../types.ts'

export type SchemaContextProps = {
  name: string
  schema?: SchemaObject
  tree: Array<SchemaType>
}

type Props = {
  name: string
  value?: SchemaObject
  tree?: Array<SchemaType>
  children?: KubbNode
}

const SchemaContext = createContext<SchemaContextProps>({
  name: 'unknown',
  tree: [],
})

export function Schema({ name, value, tree = [], children }: Props): KubbNode {
  return <SchemaContext.Provider value={{ name, schema: value, tree }}>{children}</SchemaContext.Provider>
}

type FileProps = {
  isTypeOnly?: boolean
  output: string | undefined
  children?: KubbNode
}

Schema.File = function ({ output, isTypeOnly, children }: FileProps): ReactNode {
  const { plugin, pluginManager, mode } = useApp<PluginOas>()
  const { name } = useSchema()

  if (mode === 'single') {
    const baseName = output as KubbFile.BaseName
    const resolvedPath = pluginManager.resolvePath({
      baseName: '',
      pluginKey: plugin.key,
    })

    if (!resolvedPath) {
      return null
    }

    return (
      <Parser language="typescript">
        <File
          baseName={baseName}
          path={resolvedPath}
          meta={{
            pluginKey: plugin.key,
          }}
        >
          {children}
        </File>
      </Parser>
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
    <Parser language="typescript">
      <File
        baseName={baseName}
        path={resolvedPath}
        meta={{
          pluginKey: plugin.key,
        }}
      >
        <Schema.Imports isTypeOnly={isTypeOnly} />
        {children}
      </File>
    </Parser>
  )
}

type SchemaImportsProps = {
  isTypeOnly?: boolean
  extName?: KubbFile.Extname
}

Schema.Imports = ({ isTypeOnly, extName }: SchemaImportsProps): ReactNode => {
  const { tree } = useSchema()
  const { path: root } = useFile()

  const refs = SchemaGenerator.deepSearch(tree, schemaKeywords.ref)

  return (
    <>
      {refs
        ?.map((item, i) => {
          if (!item.args.path) {
            return undefined
          }

          return <File.Import key={i} extName={extName} root={root} name={[item.args.name]} path={item.args.path} isTypeOnly={isTypeOnly} />
        })
        .filter(Boolean)}
    </>
  )
}
Schema.Context = SchemaContext
