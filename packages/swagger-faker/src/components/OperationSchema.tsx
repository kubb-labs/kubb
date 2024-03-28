/* eslint-disable no-empty-pattern */
/* eslint-disable @typescript-eslint/ban-types */
import { Editor, File, usePlugin, usePluginManager } from '@kubb/react'
import { Oas, Schema } from '@kubb/swagger/components'
import { useGetOperationFile, useOas, useOperationSchemas } from '@kubb/swagger/hooks'
import { pluginKey as swaggerTypeScriptPluginKey } from '@kubb/swagger-ts'

import { SchemaGenerator } from '../SchemaGenerator.tsx'

import type { KubbFile } from '@kubb/core'
import type { OperationSchema as OperationSchemaType } from '@kubb/swagger'
import type { ReactNode } from 'react'
import type { FileMeta, PluginOptions } from '../types.ts'

type Props = {}

export function OperationSchema({}: Props): ReactNode {
  return <></>
}

type FileProps = {
  mode: KubbFile.Mode | undefined
}

OperationSchema.File = function ({ mode = 'directory' }: FileProps): ReactNode {
  const plugin = usePlugin<PluginOptions>()

  const pluginManager = usePluginManager()
  const oas = useOas()
  const schemas = useOperationSchemas()
  const file = useGetOperationFile()

  const generator = new SchemaGenerator(plugin.options, {
    oas,
    plugin,
    pluginManager,
  })

  const items = [schemas.pathParams, schemas.queryParams, schemas.headerParams, schemas.statusCodes, schemas.request, schemas.response].flat().filter(Boolean)

  const mapItem = ({ name, schema: object, ...options }: OperationSchemaType, i: number) => {
    // used for this.options.typed
    const typeName = pluginManager.resolveName({
      name,
      pluginKey: swaggerTypeScriptPluginKey,
      type: 'type',
    })
    const typeFileName = pluginManager.resolveName({
      name: name,
      pluginKey: swaggerTypeScriptPluginKey,
      type: 'file',
    })
    const typePath = pluginManager.resolvePath({
      baseName: options.operationName || typeFileName,
      pluginKey: swaggerTypeScriptPluginKey,
      options: { tag: options.operation?.getTags()[0]?.name },
    })

    return (
      <Oas.Schema key={i} generator={generator} name={name} object={object}>
        {typeName && typePath && <File.Import isTypeOnly root={file.path} path={typePath} name={[typeName]} />}

        {mode === 'directory' && <Schema.Imports />}
        <File.Source>
          <Schema.Source options={options} />
        </File.Source>
      </Oas.Schema>
    )
  }

  return (
    <Editor language="typescript">
      <File<FileMeta> baseName={file.baseName} path={file.path} meta={file.meta}>
        <File.Import name={['faker']} path="@faker-js/faker" />
        {items.map(mapItem)}
      </File>
    </Editor>
  )
}
