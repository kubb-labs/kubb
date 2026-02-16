import { usePluginManager } from '@kubb/core/hooks'
import { createReactGenerator } from '@kubb/plugin-oas/generators'
import { useOas, useOperationManager } from '@kubb/plugin-oas/hooks'
import { getBanner, getFooter } from '@kubb/plugin-oas/utils'
import { pluginZodName } from '@kubb/plugin-zod'
import { File } from '@kubb/react-fabric'
import { Contract } from '../components/Contract.tsx'
import type { PluginOrpc } from '../types.ts'

export const contractGenerator = createReactGenerator<PluginOrpc>({
  name: 'contract',
  Operation({ operation, generator, plugin }) {
    const {
      key: pluginKey,
      options: { output, zodImportPath },
    } = plugin

    const pluginManager = usePluginManager()
    const oas = useOas()
    const { getFile, groupSchemasByName } = useOperationManager(generator)

    const file = getFile(operation)
    const schemas = groupSchemasByName(operation, { pluginKey: [pluginZodName], type: 'function' })

    // Get the name for this contract
    const name = pluginManager.resolveName({
      name: operation.getOperationId(),
      pluginKey,
      type: 'function',
    })

    // Check if there are any input schemas (request body or parameters)
    const hasInputSchemas = Boolean(schemas.request || schemas.parameters.path || schemas.parameters.query || schemas.parameters.header)

    // Get output schema name
    const outputSchemaName = schemas.responses[200] || schemas.responses[201] || schemas.responses[204] || schemas.responses.default

    // Collect all zod schema imports
    const zodSchemaImports = [
      schemas.request,
      schemas.parameters.path,
      schemas.parameters.query,
      schemas.parameters.header,
      schemas.responses.default,
      ...Object.values(schemas.responses).filter((v) => typeof v === 'string'),
    ].filter(Boolean) as string[]

    // Need to import z if we have input schemas or if we need z.void() fallback for output
    const needsZodImport = hasInputSchemas || !outputSchemaName

    // Get the zod file path for imports
    const zodFile = pluginManager.getFile({
      name: pluginManager.resolveName({
        name: operation.getOperationId(),
        pluginKey: [pluginZodName],
        type: 'file',
      }),
      extname: '.ts',
      pluginKey: [pluginZodName],
    })

    // Get the base file path for imports
    const baseFile = pluginManager.getFile({ name: 'base', extname: '.ts', pluginKey })

    return (
      <File
        baseName={file.baseName}
        path={file.path}
        meta={file.meta}
        banner={getBanner({ oas, output, config: pluginManager.config })}
        footer={getFooter({ oas, output })}
      >
        <File.Import name={['base']} root={file.path} path={baseFile.path} />
        {zodSchemaImports.length > 0 && <File.Import name={[...new Set(zodSchemaImports)]} root={file.path} path={zodFile.path} />}
        {needsZodImport && <File.Import name={['z']} path={zodImportPath} />}
        <Contract name={name} operation={operation} schemas={schemas} outputSchemaName={outputSchemaName} />
      </File>
    )
  },
})
