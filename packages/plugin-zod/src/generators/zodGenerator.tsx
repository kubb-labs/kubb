import path from 'node:path'
import type { SchemaNode } from '@kubb/ast/types'
import { defineGenerator, getMode } from '@kubb/core'
import { Const, File, Type } from '@kubb/react-fabric'
import { ZOD_NAMESPACE_IMPORTS } from '../constants.ts'
import { printerZod } from '../printers/printerZod.ts'
import type { PluginZod } from '../types'

export const zodGenerator = defineGenerator<PluginZod>({
  name: 'zod',
  type: 'react',
  Schema({ node, adapter, options, config, resolver }) {
    const { output, coercion, mapper, guidType, mini, wrapOutput, inferred, importPath, group } = options

    const root = path.resolve(config.root, config.output.path)
    const mode = getMode(path.resolve(root, output.path))

    if (!node.name) {
      return
    }

    const zodName = resolver.default(node.name, 'function')
    const file = resolver.resolveFile({ name: node.name, extname: '.ts' }, { root, output, group })

    const printer = printerZod({ coercion, mapper, guidType, mini, wrapOutput })
    const code = printer.print(node)

    if (!code) {
      return
    }

    // Resolve imports for $ref schemas
    const imports = adapter.getImports(node, (schemaName) => ({
      name: resolver.default(schemaName, 'function'),
      path: resolver.resolveFile({ name: schemaName, extname: '.ts' }, { root, output, group }).path,
    }))

    const isZodImport = ZOD_NAMESPACE_IMPORTS.has(importPath as 'zod' | 'zod/mini')

    const inferTypeName = inferred ? resolver.default(node.name, 'type') : undefined

    return (
      <File
        baseName={file.baseName}
        path={file.path}
        meta={file.meta}
        banner={resolver.resolveBanner(adapter.rootNode, { output, config })}
        footer={resolver.resolveFooter(adapter.rootNode, { output, config })}
      >
        <File.Import name={isZodImport ? 'z' : ['z']} path={importPath} isNameSpace={isZodImport} />
        {mode === 'split' &&
          imports.map((imp) => <File.Import key={[node.name, imp.path].join('-')} root={file.path} path={imp.path} name={imp.name} />)}

        <File.Source name={zodName} isExportable isIndexable>
          <Const
            export
            name={zodName}
            JSDoc={{
              comments: [node.description ? `@description ${node.description}` : undefined].filter(Boolean),
            }}
          >
            {code}
          </Const>
        </File.Source>
        {inferTypeName && (
          <File.Source name={inferTypeName} isExportable isIndexable isTypeOnly>
            <Type export name={inferTypeName}>
              {`z.infer<typeof ${zodName}>`}
            </Type>
          </File.Source>
        )}
      </File>
    )
  },
  Operation({ node, adapter, options, config, resolver }) {
    const { output, coercion: globalCoercion, mapper, guidType, mini, wrapOutput, inferred, importPath, group } = options

    const root = path.resolve(config.root, config.output.path)

    const file = resolver.resolveFile({ name: node.operationId, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path }, { root, output, group })

    const printer = printerZod({ coercion: globalCoercion, mapper, guidType, mini, wrapOutput })

    const isZodImport = ZOD_NAMESPACE_IMPORTS.has(importPath as 'zod' | 'zod/mini')

    function renderSchemaEntry({
      schema,
      name,
      description,
    }: {
      schema: SchemaNode | null | undefined
      name: string
      description?: string
    }) {
      if (!schema) return null

      const code = printer.print(schema)
      if (!code) return null

      const zodName = resolver.default(name, 'function')
      const inferTypeName = inferred ? resolver.default(name, 'type') : undefined

      const imports = adapter.getImports(schema, (schemaName) => ({
        name: resolver.default(schemaName, 'function'),
        path: resolver.resolveFile({ name: schemaName, extname: '.ts' }, { root, output, group }).path,
      }))

      return (
        <>
          {imports.map((imp) => (
            <File.Import key={[name, imp.path, imp.name].join('-')} root={file.path} path={imp.path} name={imp.name} />
          ))}
          <File.Source name={zodName} isExportable isIndexable>
            <Const
              export
              name={zodName}
              JSDoc={{
                comments: [description ? `@description ${description}` : undefined].filter(Boolean),
              }}
            >
              {code}
            </Const>
          </File.Source>
          {inferTypeName && (
            <File.Source name={inferTypeName} isExportable isIndexable isTypeOnly>
              <Type export name={inferTypeName}>
                {`z.infer<typeof ${zodName}>`}
              </Type>
            </File.Source>
          )}
        </>
      )
    }

    // Render parameter schemas
    const paramSchemas = node.parameters.map((param) =>
      renderSchemaEntry({
        schema: param.schema,
        name: `${node.operationId} ${param.in} ${param.name}`,
      }),
    )

    // Render response schemas
    const responseSchemas = node.responses.map((res) =>
      renderSchemaEntry({
        schema: res.schema,
        name: `${node.operationId} Status ${res.statusCode}`,
        description: res.description,
      }),
    )

    // Render request body schema
    const requestSchema = node.requestBody?.schema
      ? renderSchemaEntry({
          schema: node.requestBody.schema,
          name: `${node.operationId} Data`,
          description: node.requestBody.description,
        })
      : null

    return (
      <File
        baseName={file.baseName}
        path={file.path}
        meta={file.meta}
        banner={resolver.resolveBanner(adapter.rootNode, { output, config })}
        footer={resolver.resolveFooter(adapter.rootNode, { output, config })}
      >
        <File.Import name={isZodImport ? 'z' : ['z']} path={importPath} isNameSpace={isZodImport} />
        {paramSchemas}
        {responseSchemas}
        {requestSchema}
      </File>
    )
  },
})
