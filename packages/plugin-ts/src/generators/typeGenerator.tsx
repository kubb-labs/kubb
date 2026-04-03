import path from 'node:path'
import { caseParams, narrowSchema, schemaTypes, transform } from '@kubb/ast'
import type { SchemaNode } from '@kubb/ast/types'
import { defineGenerator, getMode } from '@kubb/core'
import { File } from '@kubb/react-fabric'
import { Type } from '../components/Type.tsx'
import { ENUM_TYPES_WITH_KEY_SUFFIX } from '../constants.ts'
import { printerTs } from '../printers/printerTs.ts'
import type { PluginTs } from '../types'
import { buildData, buildResponses, buildResponseUnion } from '../utils.ts'

export const typeGenerator = defineGenerator<PluginTs>({
  name: 'typescript',
  schema(node, options) {
    const { enumType, enumTypeSuffix, enumKeyCasing, syntaxType, optionalType, arrayType, output, group, printer } = options
    const { adapter, config, resolver, plugin } = this

    const transformedNode = plugin.transformer ? transform(node, plugin.transformer) : node

    if (!transformedNode.name) {
      return
    }

    const root = path.resolve(config.root, config.output.path)
    const mode = getMode(path.resolve(root, output.path))
    // Build a set of schema names that are enums so the ref handler and getImports
    // callback can use the suffixed type name (e.g. `StatusKey`) for those refs.
    const enumSchemaNames = new Set((adapter.rootNode?.schemas ?? []).filter((s) => narrowSchema(s, schemaTypes.enum) && s.name).map((s) => s.name!))

    function resolveImportName(schemaName: string): string {
      if (ENUM_TYPES_WITH_KEY_SUFFIX.has(enumType) && enumTypeSuffix && enumSchemaNames.has(schemaName)) {
        return resolver.resolveEnumKeyName({ name: schemaName }, enumTypeSuffix)
      }
      return resolver.resolveTypeName(schemaName)
    }

    const imports = adapter.getImports(transformedNode, (schemaName) => ({
      name: resolveImportName(schemaName),
      path: resolver.resolveFile({ name: schemaName, extname: '.ts' }, { root, output, group }).path,
    }))

    const isEnumSchema = !!narrowSchema(transformedNode, schemaTypes.enum)

    const meta = {
      name:
        ENUM_TYPES_WITH_KEY_SUFFIX.has(enumType) && isEnumSchema
          ? resolver.resolveEnumKeyName(transformedNode, enumTypeSuffix)
          : resolver.resolveTypeName(transformedNode.name),
      file: resolver.resolveFile({ name: transformedNode.name, extname: '.ts' }, { root, output, group }),
    } as const

    const schemaPrinter = printerTs({
      optionalType,
      arrayType,
      enumType,
      enumTypeSuffix,
      name: meta.name,
      syntaxType,
      description: transformedNode.description,
      resolver,
      enumSchemaNames,
      nodes: printer?.nodes,
    })

    return (
      <File
        baseName={meta.file.baseName}
        path={meta.file.path}
        meta={meta.file.meta}
        banner={resolver.resolveBanner(adapter.rootNode, { output, config })}
        footer={resolver.resolveFooter(adapter.rootNode, { output, config })}
      >
        {mode === 'split' &&
          imports.map((imp) => (
            <File.Import key={[transformedNode.name, imp.path, imp.isTypeOnly].join('-')} root={meta.file.path} path={imp.path} name={imp.name} isTypeOnly />
          ))}
        <Type
          name={meta.name}
          node={transformedNode}
          enumType={enumType}
          enumTypeSuffix={enumTypeSuffix}
          enumKeyCasing={enumKeyCasing}
          resolver={resolver}
          printer={schemaPrinter}
        />
      </File>
    )
  },
  operation(node, options) {
    const { enumType, enumTypeSuffix, enumKeyCasing, optionalType, arrayType, syntaxType, paramsCasing, group, output, printer } = options
    const { adapter, config, resolver, plugin } = this

    const transformedNode = plugin.transformer ? transform(node, plugin.transformer) : node

    const root = path.resolve(config.root, config.output.path)
    const mode = getMode(path.resolve(root, output.path))

    const params = caseParams(transformedNode.parameters, paramsCasing)

    const meta = {
      file: resolver.resolveFile(
        { name: transformedNode.operationId, extname: '.ts', tag: transformedNode.tags[0] ?? 'default', path: transformedNode.path },
        { root, output, group },
      ),
    } as const

    // Build a set of schema names that are enums so the ref handler and getImports
    // callback can use the suffixed type name (e.g. `StatusKey`) for those refs.
    const enumSchemaNames = new Set((adapter.rootNode?.schemas ?? []).filter((s) => narrowSchema(s, schemaTypes.enum) && s.name).map((s) => s.name!))

    function resolveImportName(schemaName: string): string {
      if (ENUM_TYPES_WITH_KEY_SUFFIX.has(enumType) && enumTypeSuffix && enumSchemaNames.has(schemaName)) {
        return resolver.resolveEnumKeyName({ name: schemaName }, enumTypeSuffix)
      }
      return resolver.resolveTypeName(schemaName)
    }

    function renderSchemaType({ schema, name, keysToOmit }: { schema: SchemaNode | null; name: string; keysToOmit?: Array<string> }) {
      if (!schema) return null

      const imports = adapter.getImports(schema, (schemaName) => ({
        name: resolveImportName(schemaName),
        path: resolver.resolveFile({ name: schemaName, extname: '.ts' }, { root, output, group }).path,
      }))

      const schemaPrinter = printerTs({
        optionalType,
        arrayType,
        enumType,
        enumTypeSuffix,
        name,
        syntaxType,
        description: schema.description,
        keysToOmit,
        resolver,
        enumSchemaNames,
        nodes: printer?.nodes,
      })

      return (
        <>
          {mode === 'split' &&
            imports.map((imp) => (
              <File.Import key={[name, imp.path, imp.isTypeOnly].join('-')} root={meta.file.path} path={imp.path} name={imp.name} isTypeOnly />
            ))}
          <Type
            name={name}
            node={schema}
            enumType={enumType}
            enumTypeSuffix={enumTypeSuffix}
            enumKeyCasing={enumKeyCasing}
            resolver={resolver}
            printer={schemaPrinter}
          />
        </>
      )
    }

    const paramTypes = params.map((param) =>
      renderSchemaType({
        schema: param.schema,
        name: resolver.resolveParamName(transformedNode, param),
      }),
    )

    const requestType = transformedNode.requestBody?.schema
      ? renderSchemaType({
          schema: {
            ...transformedNode.requestBody.schema,
            description: transformedNode.requestBody.description ?? transformedNode.requestBody.schema.description,
          },
          name: resolver.resolveDataName(transformedNode),
          keysToOmit: transformedNode.requestBody.keysToOmit,
        })
      : null

    const responseTypes = transformedNode.responses.map((res) =>
      renderSchemaType({
        schema: res.schema,
        name: resolver.resolveResponseStatusName(transformedNode, res.statusCode),
        keysToOmit: res.keysToOmit,
      }),
    )

    const dataType = renderSchemaType({
      schema: buildData({ ...transformedNode, parameters: params }, { resolver }),
      name: resolver.resolveRequestConfigName(transformedNode),
    })

    const responsesType = renderSchemaType({
      schema: buildResponses(transformedNode, { resolver }),
      name: resolver.resolveResponsesName(transformedNode),
    })

    const responseType = renderSchemaType({
      schema: transformedNode.responses.some((res) => res.schema)
        ? {
            ...buildResponseUnion(transformedNode, { resolver })!,
            description: 'Union of all possible responses',
          }
        : null,
      name: resolver.resolveResponseName(transformedNode),
    })

    return (
      <File
        baseName={meta.file.baseName}
        path={meta.file.path}
        meta={meta.file.meta}
        banner={resolver.resolveBanner(adapter.rootNode, { output, config })}
        footer={resolver.resolveFooter(adapter.rootNode, { output, config })}
      >
        {paramTypes}
        {responseTypes}
        {requestType}
        {dataType}
        {responsesType}
        {responseType}
      </File>
    )
  },
})
