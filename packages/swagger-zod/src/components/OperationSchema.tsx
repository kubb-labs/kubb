import { Editor, File, useApp } from '@kubb/react'
import { schemaKeywords } from '@kubb/swagger'
import { Oas, Schema } from '@kubb/swagger/components'
import { useOas, useOperation, useOperationManager } from '@kubb/swagger/hooks'

import { SchemaGenerator } from '../SchemaGenerator.tsx'

import type { OperationSchema as OperationSchemaType } from '@kubb/swagger'
import type { ReactNode } from 'react'
import type { FileMeta, PluginOptions } from '../types.ts'

type Props = {}

export function OperationSchema({}: Props): ReactNode {
  return <></>
}

type FileProps = {}

OperationSchema.File = function ({}: FileProps): ReactNode {
  const { pluginManager, plugin, mode } = useApp<PluginOptions>()
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

  const mapItem = ({ name, schema: object, ...options }: OperationSchemaType, i: number) => {
    // hack so Params can be optional when needed
    const required = Array.isArray(object?.required) ? !!object.required.length : !!object?.required
    const optional = !required && !!name.includes('Params')

    return (
      <Oas.Schema key={i} generator={generator} name={name} object={object}>
        {mode === 'split' && <Schema.Imports />}
        <File.Source>
          <Schema.Source extraSchemas={optional ? [{ keyword: schemaKeywords.optional }] : undefined} options={options} />
        </File.Source>
      </Oas.Schema>
    )
  }

  return (
    <Editor language="typescript">
      <File<FileMeta> baseName={file.baseName} path={file.path} meta={file.meta}>
        <File.Import name={['z']} path="zod" />
        {items.map(mapItem)}
      </File>
    </Editor>
  )
}
