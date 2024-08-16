import { Oas } from '@kubb/plugin-oas/components'
import { useOas, useOperation, useOperationManager } from '@kubb/plugin-oas/hooks'
import { File, Parser, useApp } from '@kubb/react'
import { pluginTsName } from '@kubb/swagger-ts'

import { SchemaGenerator } from '../SchemaGenerator.tsx'

import type { OperationSchema as OperationSchemaType } from '@kubb/plugin-oas'
import type { ReactNode } from 'react'
import type { FileMeta, PluginFaker } from '../types.ts'
import { Schema } from './Schema.tsx'

type Props = {
  description?: string
}

export function OperationSchema({ description }: Props): ReactNode {
  return <Schema withData={false} description={description} />
}

type FileProps = {}

OperationSchema.File = function ({}: FileProps): ReactNode {
  const { plugin, pluginManager, mode } = useApp<PluginFaker>()

  const oas = useOas()
  const { getSchemas, getFile } = useOperationManager()
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

  const mapItem = ({ name, schema, description, ...options }: OperationSchemaType, i: number) => {
    // used for this.options.typed
    const typeName = pluginManager.resolveName({
      name,
      pluginKey: [pluginTsName],
      type: 'type',
    })
    const typeFileName = pluginManager.resolveName({
      name: options.operationName || name,
      pluginKey: [pluginTsName],
      type: 'file',
    })
    const typePath = pluginManager.resolvePath({
      baseName: typeFileName,
      pluginKey: [pluginTsName],
      options: { tag: options.operation?.getTags()[0]?.name },
    })

    const tree = generator.parse({ schema, name })

    return (
      <Oas.Schema key={i} name={name} value={schema} tree={tree}>
        {typeName && typePath && <File.Import extName={plugin.options.extName} isTypeOnly root={file.path} path={typePath} name={[typeName]} />}
        {plugin.options.dateParser && <File.Import path={plugin.options.dateParser} name={plugin.options.dateParser} />}

        {mode === 'split' && <Oas.Schema.Imports extName={plugin.options.extName} />}
        <File.Source>
          <OperationSchema description={description} />
        </File.Source>
      </Oas.Schema>
    )
  }

  return (
    <Parser language="typescript">
      <File<FileMeta> baseName={file.baseName} path={file.path} meta={file.meta}>
        <File.Import name={['faker']} path="@faker-js/faker" />
        {plugin.options.regexGenerator === 'randexp' && <File.Import name={'RandExp'} path={'randexp'} />}
        {items.map(mapItem)}
      </File>
    </Parser>
  )
}
