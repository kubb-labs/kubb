import path from 'node:path'
import { caseParams, composeTransformers, transform } from '@kubb/ast'
import type { SchemaNode } from '@kubb/ast/types'
import { defineGenerator, getMode } from '@kubb/core'
import { File } from '@kubb/react-fabric'
import { Zod } from '../components/Zod.tsx'
import { ZodMini } from '../components/ZodMini.tsx'
import { ZOD_NAMESPACE_IMPORTS } from '../constants.ts'
import type { PluginZod } from '../types'

export const zodGenerator = defineGenerator<PluginZod>({
  name: 'zod',
  type: 'react',
  Schema({ node, adapter, options, config, resolver }) {
    const { output, coercion, guidType, mini, wrapOutput, inferred, importPath, group, transformers = [] } = options

    const root = path.resolve(config.root, config.output.path)
    const mode = getMode(path.resolve(root, output.path))

    if (!node.name) {
      return
    }

    const schemaNode = transform(node, composeTransformers(...transformers))
    const zodName = resolver.default(schemaNode.name!, 'function')
    const file = resolver.resolveFile({ name: node.name, extname: '.ts' }, { root, output, group })

    // Resolve imports for $ref schemas
    const imports = adapter.getImports(schemaNode, (schemaName) => ({
      name: resolver.default(schemaName, 'function'),
      path: resolver.resolveFile({ name: schemaName, extname: '.ts' }, { root, output, group }).path,
    }))

    const isZodImport = ZOD_NAMESPACE_IMPORTS.has(importPath as 'zod' | 'zod/mini')
    const inferTypeName = inferred ? resolver.resolveInferName(resolver.resolveName(node.name)) : undefined

    return (
      <File
        baseName={file.baseName}
        path={file.path}
        meta={file.meta}
        banner={resolver.resolveBanner(adapter.rootNode, { output, config })}
        footer={resolver.resolveFooter(adapter.rootNode, { output, config })}
      >
        <File.Import name={isZodImport ? 'z' : ['z']} path={importPath} isNameSpace={isZodImport} />
        {mode === 'split' && imports.map((imp) => <File.Import key={[node.name, imp.path].join('-')} root={file.path} path={imp.path} name={imp.name} />)}

        {mini ? (
          <ZodMini
            name={zodName}
            node={schemaNode}
            guidType={guidType}
            wrapOutput={wrapOutput}
            description={schemaNode.description}
            inferTypeName={inferTypeName}
            resolver={resolver}
          />
        ) : (
          <Zod
            name={zodName}
            node={schemaNode}
            coercion={coercion}
            guidType={guidType}
            wrapOutput={wrapOutput}
            description={schemaNode.description}
            inferTypeName={inferTypeName}
            resolver={resolver}
          />
        )}
      </File>
    )
  },
  Operation({ node, adapter, options, config, resolver }) {
    const { output, coercion, guidType, mini, wrapOutput, inferred, importPath, group, paramsCasing } = options

    const root = path.resolve(config.root, config.output.path)
    const mode = getMode(path.resolve(root, output.path))

    const file = resolver.resolveFile({ name: node.operationId, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path }, { root, output, group })

    const isZodImport = ZOD_NAMESPACE_IMPORTS.has(importPath as 'zod' | 'zod/mini')

    const params = caseParams(node.parameters, paramsCasing)

    function renderSchemaEntry({ schema, name, description, keysToOmit }: { schema: SchemaNode | null | undefined; name: string; description?: string; keysToOmit?: Array<string> }) {
      if (!schema) return null

      const inferTypeName = inferred ? resolver.resolveInferName(name) : undefined

      const imports = adapter.getImports(schema, (schemaName) => ({
        name: resolver.default(schemaName, 'function'),
        path: resolver.resolveFile({ name: schemaName, extname: '.ts' }, { root, output, group }).path,
      }))

      return (
        <>
          {mode === 'split' &&
            imports.map((imp) => <File.Import key={[name, imp.path, imp.name].join('-')} root={file.path} path={imp.path} name={imp.name} />)}
          {mini ? (
            <ZodMini
              name={name}
              node={schema}
              guidType={guidType}
              wrapOutput={wrapOutput}
              description={description}
              inferTypeName={inferTypeName}
              resolver={resolver}
              keysToOmit={keysToOmit}
            />
          ) : (
            <Zod
              name={name}
              node={schema}
              coercion={coercion}
              guidType={guidType}
              wrapOutput={wrapOutput}
              description={description}
              inferTypeName={inferTypeName}
              resolver={resolver}
              keysToOmit={keysToOmit}
            />
          )}
        </>
      )
    }

    // Render parameter schemas
    const paramSchemas = params.map((param) =>
      renderSchemaEntry({
        schema: param.schema,
        name: resolver.resolveParamName(node, param),
      }),
    )

    // Render response schemas
    const responseSchemas = node.responses.map((res) =>
      renderSchemaEntry({
        schema: res.schema,
        name: resolver.resolveResponseStatusName(node, res.statusCode),
        description: res.description,
        keysToOmit: res.keysToOmit,
      }),
    )

    // Render request body schema
    const requestSchema = node.requestBody?.schema
      ? renderSchemaEntry({
          schema: node.requestBody.schema,
          name: resolver.resolveDataName(node),
          description: node.requestBody.description,
          keysToOmit: node.requestBody.keysToOmit,
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
