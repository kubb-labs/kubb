import { caseParams } from '@kubb/ast'
import type { SchemaNode } from '@kubb/ast/types'
import { defineGenerator } from '@kubb/core'
import { File } from '@kubb/renderer-jsx'
import { Operations } from '../components/Operations.tsx'
import { Zod } from '../components/Zod.tsx'
import { ZOD_NAMESPACE_IMPORTS } from '../constants.ts'
import { printerZod } from '../printers/printerZod.ts'
import { printerZodMini } from '../printers/printerZodMini.ts'
import type { PluginZod } from '../types'
import { buildSchemaNames } from '../utils.ts'

export const zodGenerator = defineGenerator<PluginZod>({
  name: 'zod',
  schema(node, options) {
    const { adapter, config, resolver, root } = this
    const { output, coercion, guidType, mini, wrapOutput, inferred, importPath, group, printer } = options

    if (!node.name) {
      return
    }

    const mode = this.getMode(output)
    const isZodImport = ZOD_NAMESPACE_IMPORTS.has(importPath as 'zod' | 'zod/mini')

    const imports = adapter.getImports(node, (schemaName) => ({
      name: resolver.resolveSchemaName(schemaName),
      path: resolver.resolveFile({ name: schemaName, extname: '.ts' }, { root, output, group }).path,
    }))

    const meta = {
      name: resolver.resolveSchemaName(node.name),
      file: resolver.resolveFile({ name: node.name, extname: '.ts' }, { root, output, group }),
    } as const

    const inferTypeName = inferred ? resolver.resolveSchemaTypeName(node.name) : undefined

    const schemaPrinter = mini
      ? printerZodMini({ guidType, wrapOutput, resolver, schemaName: meta.name, nodes: printer?.nodes })
      : printerZod({ coercion, guidType, wrapOutput, resolver, schemaName: meta.name, nodes: printer?.nodes })

    return (
      <File
        baseName={meta.file.baseName}
        path={meta.file.path}
        meta={meta.file.meta}
        banner={resolver.resolveBanner(adapter.inputNode, { output, config })}
        footer={resolver.resolveFooter(adapter.inputNode, { output, config })}
      >
        <File.Import name={isZodImport ? 'z' : ['z']} path={importPath} isNameSpace={isZodImport} />
        {mode === 'split' && imports.map((imp) => <File.Import key={[node.name, imp.path].join('-')} root={meta.file.path} path={imp.path} name={imp.name} />)}

        <Zod name={meta.name} node={node} printer={schemaPrinter} inferTypeName={inferTypeName} />
      </File>
    )
  },
  operation(node, options) {
    const { adapter, config, resolver, root } = this
    const { output, coercion, guidType, mini, wrapOutput, inferred, importPath, group, paramsCasing, printer } = options

    const mode = this.getMode(output)
    const isZodImport = ZOD_NAMESPACE_IMPORTS.has(importPath as 'zod' | 'zod/mini')

    const params = caseParams(node.parameters, paramsCasing)

    const meta = {
      file: resolver.resolveFile({ name: node.operationId, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path }, { root, output, group }),
    } as const

    function renderSchemaEntry({ schema, name, keysToOmit }: { schema: SchemaNode | null; name: string; keysToOmit?: Array<string> }) {
      if (!schema) return null

      const inferTypeName = inferred ? resolver.resolveTypeName(name) : undefined

      const imports = adapter.getImports(schema, (schemaName) => ({
        name: resolver.resolveSchemaName(schemaName),
        path: resolver.resolveFile({ name: schemaName, extname: '.ts' }, { root, output, group }).path,
      }))

      const schemaPrinter = mini
        ? printerZodMini({ guidType, wrapOutput, resolver, schemaName: name, keysToOmit, nodes: printer?.nodes })
        : printerZod({ coercion, guidType, wrapOutput, resolver, schemaName: name, keysToOmit, nodes: printer?.nodes })

      return (
        <>
          {mode === 'split' &&
            imports.map((imp) => <File.Import key={[name, imp.path, imp.name].join('-')} root={meta.file.path} path={imp.path} name={imp.name} />)}
          <Zod name={name} node={schema} printer={schemaPrinter} inferTypeName={inferTypeName} />
        </>
      )
    }

    const paramSchemas = params.map((param) => renderSchemaEntry({ schema: param.schema, name: resolver.resolveParamName(node, param) }))

    const responseSchemas = node.responses.map((res) =>
      renderSchemaEntry({
        schema: res.schema,
        name: resolver.resolveResponseStatusName(node, res.statusCode),
        keysToOmit: res.keysToOmit,
      }),
    )

    const requestSchema = node.requestBody?.schema
      ? renderSchemaEntry({
          schema: {
            ...node.requestBody.schema,
            description: node.requestBody.description ?? node.requestBody.schema.description,
          },
          name: resolver.resolveDataName(node),
          keysToOmit: node.requestBody.keysToOmit,
        })
      : null

    return (
      <File
        baseName={meta.file.baseName}
        path={meta.file.path}
        meta={meta.file.meta}
        banner={resolver.resolveBanner(adapter.inputNode, { output, config })}
        footer={resolver.resolveFooter(adapter.inputNode, { output, config })}
      >
        <File.Import name={isZodImport ? 'z' : ['z']} path={importPath} isNameSpace={isZodImport} />
        {paramSchemas}
        {responseSchemas}
        {requestSchema}
      </File>
    )
  },
  operations(nodes, options) {
    const { adapter, config, resolver, root } = this
    const { output, importPath, group, operations, paramsCasing } = options

    if (!operations) {
      return
    }
    const isZodImport = ZOD_NAMESPACE_IMPORTS.has(importPath as 'zod' | 'zod/mini')

    const meta = {
      file: resolver.resolveFile({ name: 'operations', extname: '.ts' }, { root, output, group }),
    } as const

    const transformedOperations = nodes.map((node) => {
      const params = caseParams(node.parameters, paramsCasing)

      return {
        node,
        data: buildSchemaNames(node, { params, resolver }),
      }
    })

    const imports = transformedOperations.flatMap(({ node, data }) => {
      const names = [data.request, ...Object.values(data.responses), ...Object.values(data.parameters)].filter(Boolean) as string[]
      const opFile = resolver.resolveFile({ name: node.operationId, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path }, { root, output, group })

      return names.map((name) => <File.Import key={[name, opFile.path].join('-')} name={[name]} root={meta.file.path} path={opFile.path} />)
    })

    return (
      <File
        baseName={meta.file.baseName}
        path={meta.file.path}
        meta={meta.file.meta}
        banner={resolver.resolveBanner(adapter.inputNode, { output, config })}
        footer={resolver.resolveFooter(adapter.inputNode, { output, config })}
      >
        <File.Import isTypeOnly name={isZodImport ? 'z' : ['z']} path={importPath} isNameSpace={isZodImport} />
        {imports}
        <Operations name="operations" operations={transformedOperations} />
      </File>
    )
  },
})
