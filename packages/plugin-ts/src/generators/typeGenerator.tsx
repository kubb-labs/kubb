import { ast, defineGenerator } from '@kubb/core'
import { File, jsxRenderer } from '@kubb/renderer-jsx'
import { Type } from '../components/Type.tsx'
import { ENUM_TYPES_WITH_KEY_SUFFIX } from '../constants.ts'
import { printerTs } from '../printers/printerTs.ts'
import type { PluginTs } from '../types'
import { buildData, buildResponses, buildResponseUnion } from '../utils.ts'

export const typeGenerator = defineGenerator<PluginTs>({
  name: 'typescript',
  renderer: jsxRenderer,
  schema(node, ctx) {
    const { enumType, enumTypeSuffix, enumKeyCasing, syntaxType, optionalType, arrayType, output, group, printer } = ctx.options
    const { adapter, config, resolver, root } = ctx

    if (!node.name) {
      return
    }
    const mode = ctx.getMode(output)
    // Build a set of schema names that are enums so the ref handler and getImports
    // callback can use the suffixed type name (e.g. `StatusKey`) for those refs.
    const enumSchemaNames = new Set((adapter.inputNode?.schemas ?? []).filter((s) => ast.narrowSchema(s, ast.schemaTypes.enum) && s.name).map((s) => s.name!))

    function resolveImportName(schemaName: string): string {
      if (ENUM_TYPES_WITH_KEY_SUFFIX.has(enumType) && enumTypeSuffix && enumSchemaNames.has(schemaName)) {
        return resolver.resolveEnumKeyName({ name: schemaName }, enumTypeSuffix)
      }
      return resolver.resolveTypeName(schemaName)
    }

    const imports = adapter.getImports(node, (schemaName) => ({
      name: resolveImportName(schemaName),
      path: resolver.resolveFile({ name: schemaName, extname: '.ts' }, { root, output, group }).path,
    }))

    const isEnumSchema = !!ast.narrowSchema(node, ast.schemaTypes.enum)

    const meta = {
      name: ENUM_TYPES_WITH_KEY_SUFFIX.has(enumType) && isEnumSchema ? resolver.resolveEnumKeyName(node, enumTypeSuffix) : resolver.resolveTypeName(node.name),
      file: resolver.resolveFile({ name: node.name, extname: '.ts' }, { root, output, group }),
    } as const

    const schemaPrinter = printerTs({
      optionalType,
      arrayType,
      enumType,
      enumTypeSuffix,
      name: meta.name,
      syntaxType,
      description: node.description,
      resolver,
      enumSchemaNames,
      nodes: printer?.nodes,
    })

    return (
      <File
        baseName={meta.file.baseName}
        path={meta.file.path}
        meta={meta.file.meta}
        banner={resolver.resolveBanner(adapter.inputNode, { output, config })}
        footer={resolver.resolveFooter(adapter.inputNode, { output, config })}
      >
        {mode === 'split' &&
          imports.map((imp) => (
            <File.Import key={[node.name, imp.path, imp.isTypeOnly].join('-')} root={meta.file.path} path={imp.path} name={imp.name} isTypeOnly />
          ))}
        <Type
          name={meta.name}
          node={node}
          enumType={enumType}
          enumTypeSuffix={enumTypeSuffix}
          enumKeyCasing={enumKeyCasing}
          resolver={resolver}
          printer={schemaPrinter}
        />
      </File>
    )
  },
  operation(node, ctx) {
    const { enumType, enumTypeSuffix, enumKeyCasing, optionalType, arrayType, syntaxType, paramsCasing, group, output, printer } = ctx.options
    const { adapter, config, resolver, root } = ctx

    const mode = ctx.getMode(output)

    const params = ast.caseParams(node.parameters, paramsCasing)

    const meta = {
      file: resolver.resolveFile({ name: node.operationId, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path }, { root, output, group }),
    } as const

    // Build a set of schema names that are enums so the ref handler and getImports
    // callback can use the suffixed type name (e.g. `StatusKey`) for those refs.
    const enumSchemaNames = new Set((adapter.inputNode?.schemas ?? []).filter((s) => ast.narrowSchema(s, ast.schemaTypes.enum) && s.name).map((s) => s.name!))

    function resolveImportName(schemaName: string): string {
      if (ENUM_TYPES_WITH_KEY_SUFFIX.has(enumType) && enumTypeSuffix && enumSchemaNames.has(schemaName)) {
        return resolver.resolveEnumKeyName({ name: schemaName }, enumTypeSuffix)
      }
      return resolver.resolveTypeName(schemaName)
    }

    function renderSchemaType({ schema, name, keysToOmit }: { schema: ast.SchemaNode | null; name: string; keysToOmit?: Array<string> }) {
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
        name: resolver.resolveParamName(node, param),
      }),
    )

    const requestType = node.requestBody?.schema
      ? renderSchemaType({
          schema: {
            ...node.requestBody.schema,
            description: node.requestBody.description ?? node.requestBody.schema.description,
          },
          name: resolver.resolveDataName(node),
          keysToOmit: node.requestBody.keysToOmit,
        })
      : null

    const responseTypes = node.responses.map((res) =>
      renderSchemaType({
        schema: res.schema,
        name: resolver.resolveResponseStatusName(node, res.statusCode),
        keysToOmit: res.keysToOmit,
      }),
    )

    const dataType = renderSchemaType({
      schema: buildData({ ...node, parameters: params }, { resolver }),
      name: resolver.resolveRequestConfigName(node),
    })

    const responsesType = renderSchemaType({
      schema: buildResponses(node, { resolver }),
      name: resolver.resolveResponsesName(node),
    })

    const responseType = renderSchemaType({
      schema: node.responses.some((res) => res.schema)
        ? {
            ...buildResponseUnion(node, { resolver })!,
            description: 'Union of all possible responses',
          }
        : null,
      name: resolver.resolveResponseName(node),
    })

    return (
      <File
        baseName={meta.file.baseName}
        path={meta.file.path}
        meta={meta.file.meta}
        banner={resolver.resolveBanner(adapter.inputNode, { output, config })}
        footer={resolver.resolveFooter(adapter.inputNode, { output, config })}
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
