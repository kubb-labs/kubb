import path from 'node:path'
import { caseParams, transform } from '@kubb/ast'
import type { SchemaNode } from '@kubb/ast/types'
import { defineGenerator, getMode } from '@kubb/core'
import { File } from '@kubb/react-fabric'
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
    const { adapter, config, resolver, plugin, root } = this
    const { output, coercion, guidType, mini, wrapOutput, inferred, importPath, group, printer } = options

    const transformedNode = plugin.transformer ? transform(node, plugin.transformer) : node

    if (!transformedNode.name) {
      return
    }

    const mode = getMode(path.resolve(root, output.path))
    const isZodImport = ZOD_NAMESPACE_IMPORTS.has(importPath as 'zod' | 'zod/mini')

    const imports = adapter.getImports(transformedNode, (schemaName) => ({
      name: resolver.resolveSchemaName(schemaName),
      path: resolver.resolveFile({ name: schemaName, extname: '.ts' }, { root, output, group }).path,
    }))

    const meta = {
      name: resolver.resolveSchemaName(transformedNode.name),
      file: resolver.resolveFile({ name: transformedNode.name, extname: '.ts' }, { root, output, group }),
    } as const

    const inferTypeName = inferred ? resolver.resolveSchemaTypeName(transformedNode.name) : undefined

    const schemaPrinter = mini
      ? printerZodMini({ guidType, wrapOutput, resolver, schemaName: meta.name, nodes: printer?.nodes })
      : printerZod({ coercion, guidType, wrapOutput, resolver, schemaName: meta.name, nodes: printer?.nodes })

    return (
      <File
        baseName={meta.file.baseName}
        path={meta.file.path}
        meta={meta.file.meta}
        banner={resolver.resolveBanner(adapter.rootNode, { output, config })}
        footer={resolver.resolveFooter(adapter.rootNode, { output, config })}
      >
        <File.Import name={isZodImport ? 'z' : ['z']} path={importPath} isNameSpace={isZodImport} />
        {mode === 'split' &&
          imports.map((imp) => <File.Import key={[transformedNode.name, imp.path].join('-')} root={meta.file.path} path={imp.path} name={imp.name} />)}

        <Zod name={meta.name} node={transformedNode} printer={schemaPrinter} inferTypeName={inferTypeName} />
      </File>
    )
  },
  operation(node, options) {
    const { adapter, config, resolver, plugin, root } = this
    const { output, coercion, guidType, mini, wrapOutput, inferred, importPath, group, paramsCasing, printer } = options

    const transformedNode = plugin.transformer ? transform(node, plugin.transformer) : node

    const mode = getMode(path.resolve(root, output.path))
    const isZodImport = ZOD_NAMESPACE_IMPORTS.has(importPath as 'zod' | 'zod/mini')

    const params = caseParams(transformedNode.parameters, paramsCasing)

    const meta = {
      file: resolver.resolveFile(
        { name: transformedNode.operationId, extname: '.ts', tag: transformedNode.tags[0] ?? 'default', path: transformedNode.path },
        { root, output, group },
      ),
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

    const responseSchemas = transformedNode.responses.map((res) =>
      renderSchemaEntry({
        schema: res.schema,
        name: resolver.resolveResponseStatusName(transformedNode, res.statusCode),
        keysToOmit: res.keysToOmit,
      }),
    )

    const requestSchema = transformedNode.requestBody?.schema
      ? renderSchemaEntry({
          schema: {
            ...transformedNode.requestBody.schema,
            description: transformedNode.requestBody.description ?? transformedNode.requestBody.schema.description,
          },
          name: resolver.resolveDataName(transformedNode),
          keysToOmit: transformedNode.requestBody.keysToOmit,
        })
      : null

    return (
      <File
        baseName={meta.file.baseName}
        path={meta.file.path}
        meta={meta.file.meta}
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
  operations(nodes, options) {
    const { adapter, config, resolver, plugin, root } = this
    const { output, importPath, group, operations, paramsCasing } = options

    if (!operations) {
      return
    }
    const isZodImport = ZOD_NAMESPACE_IMPORTS.has(importPath as 'zod' | 'zod/mini')

    const meta = {
      file: resolver.resolveFile({ name: 'operations', extname: '.ts' }, { root, output, group }),
    } as const

    const transformedOperations = nodes.map((node) => {
      const transformedNode = plugin.transformer ? transform(node, plugin.transformer) : node

      const params = caseParams(transformedNode.parameters, paramsCasing)

      return {
        node: transformedNode,
        data: buildSchemaNames(transformedNode, { params, resolver }),
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
        banner={resolver.resolveBanner(adapter.rootNode, { output, config })}
        footer={resolver.resolveFooter(adapter.rootNode, { output, config })}
      >
        <File.Import isTypeOnly name={isZodImport ? 'z' : ['z']} path={importPath} isNameSpace={isZodImport} />
        {imports}
        <Operations name="operations" operations={transformedOperations} />
      </File>
    )
  },
})
