import { schemaKeywords } from '@kubb/plugin-oas'
import { Oas } from '@kubb/plugin-oas/components'
import { useOas, useOperation, useOperationManager } from '@kubb/plugin-oas/hooks'
import { File, Parser, useApp } from '@kubb/react'

import { SchemaGenerator } from '../SchemaGenerator.tsx'

import type { OperationSchema as OperationSchemaType } from '@kubb/plugin-oas'
import type { ReactNode } from 'react'
import type { FileMeta, PluginZod } from '../types.ts'

type Props = {}

export function OperationSchema({}: Props): ReactNode {
  return <></>
}

type FileProps = {}

OperationSchema.File = function ({}: FileProps): ReactNode {
  const { pluginManager, plugin, mode } = useApp<PluginZod>()
  const { getSchemas, getFile } = useOperationManager()
  const oas = useOas()
  const operation = useOperation()

  const file = getFile(operation)
  const schemas = getSchemas(operation)
  const generator = new SchemaGenerator(plugin.options, {
    oas,
    plugin,
    pluginManager,
    mode,
    override: plugin.options.override,
  })

  const items = [schemas.pathParams, schemas.queryParams, schemas.headerParams, schemas.statusCodes, schemas.request, schemas.response].flat().filter(Boolean)

  const mapItem = ({ name, schema, ...options }: OperationSchemaType, i: number) => {
    // hack so Params can be optional when needed
    const required = Array.isArray(schema?.required) ? !!schema.required.length : !!schema?.required
    const optional = !required && !!name.includes('Params')
    const tree = generator.parse({ schema, name })
    const source = generator.getSource(name, [...tree, optional ? { keyword: schemaKeywords.optional } : undefined].filter(Boolean), options)

    return (
      <Oas.Schema key={i} name={name} value={schema} tree={tree}>
        {mode === 'split' && <Oas.Schema.Imports />}
        <File.Source>{source.join('\n')}</File.Source>
      </Oas.Schema>
    )
  }

  return (
    <Parser language="typescript">
      <File<FileMeta> baseName={file.baseName} path={file.path} meta={file.meta}>
        <File.Import name={['z']} path="zod" />
        {items.map(mapItem)}
      </File>
    </Parser>
  )
}
