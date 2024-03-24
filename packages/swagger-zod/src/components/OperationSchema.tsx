/* eslint-disable no-empty-pattern */
/* eslint-disable @typescript-eslint/ban-types */
import { Editor, File, usePlugin, usePluginManager } from '@kubb/react'
import { schemaKeywords } from '@kubb/swagger'
import { Oas, Schema } from '@kubb/swagger/components'
import { useGetOperationFile, useOas, useOperationSchemas } from '@kubb/swagger/hooks'

import { SchemaGenerator } from '../SchemaGenerator.tsx'

import type { KubbFile } from '@kubb/core'
import type { OperationSchema as OperationSchemaType } from '@kubb/swagger'
import type { ReactNode } from 'react'
import type { FileMeta, PluginOptions } from '../types.ts'

type Props = {}

export function OperationSchema({}: Props): ReactNode {
  return (
    <>
    </>
  )
}

type FileProps = {
  mode: KubbFile.Mode | undefined
}

OperationSchema.File = function({ mode = 'directory' }: FileProps): ReactNode {
  const plugin = usePlugin<PluginOptions>()

  const pluginManager = usePluginManager()
  const oas = useOas()
  const schemas = useOperationSchemas()
  const file = useGetOperationFile()

  const generator = new SchemaGenerator(plugin.options, { oas, plugin, pluginManager })

  const items = [
    schemas.pathParams,
    schemas.queryParams,
    schemas.headerParams,
    schemas.statusCodes,
    schemas.request,
    schemas.response,
  ].flat().filter(Boolean)

  const mapItem = ({ name, schema: object, ...options }: OperationSchemaType, i: number) => {
    // hack so Params can be optional when needed
    const required = Array.isArray(object?.required) ? !!object.required.length : !!object?.required
    const optional = !required && !!name.includes('Params')

    return (
      <Oas.Schema key={i} generator={generator} name={name} object={object}>
        {mode === 'directory'
          && <Schema.Imports />}
        <File.Source>
          <Schema.Source extraSchemas={optional ? [{ keyword: schemaKeywords.optional }] : undefined} options={options} />
        </File.Source>
      </Oas.Schema>
    )
  }

  return (
    <Editor language="typescript">
      <File<FileMeta>
        baseName={file.baseName}
        path={file.path}
        meta={file.meta}
      >
        <File.Import name={['z']} path="zod" />
        {items.map(mapItem)}
      </File>
    </Editor>
  )
}
