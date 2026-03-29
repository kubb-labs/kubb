import path from 'node:path'
import { caseParams, composeTransformers, narrowSchema, schemaTypes, transform } from '@kubb/ast'
import type { SchemaNode } from '@kubb/ast/types'
import { defineGenerator, getMode } from '@kubb/core'
import { File } from '@kubb/react-fabric'
import { Type } from '../components/Type.tsx'
import { ENUM_TYPES_WITH_KEY_SUFFIX } from '../constants.ts'
import type { PluginTs } from '../types'
import { buildData, buildResponses, buildResponseUnion } from '../utils.ts'

export const typeGenerator = defineGenerator<PluginTs>({
  name: 'typescript',
  type: 'react',
  Operation({ node, adapter, options, config, resolver }) {
    const { enumType, enumTypeSuffix, enumKeyCasing, optionalType, arrayType, syntaxType, paramsCasing, group, output, transformers = [] } = options

    const root = path.resolve(config.root, config.output.path)
    const mode = getMode(path.resolve(root, output.path))

    const file = resolver.resolveFile({ name: node.operationId, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path }, { root, output, group })

    const params = caseParams(node.parameters, paramsCasing)

    // Build a set of schema names that are enums so the ref handler and getImports
    // callback can use the suffixed type name (e.g. `StatusKey`) for those refs.
    const enumSchemaNames = new Set((adapter.rootNode?.schemas ?? []).filter((s) => narrowSchema(s, schemaTypes.enum) && s.name).map((s) => s.name!))

    function resolveImportName(schemaName: string): string {
      if (ENUM_TYPES_WITH_KEY_SUFFIX.has(enumType) && enumTypeSuffix && enumSchemaNames.has(schemaName)) {
        return resolver.resolveEnumKeyName({ name: schemaName } as SchemaNode, enumTypeSuffix)
      }
      return resolver.default(schemaName, 'type')
    }

    function renderSchemaType({
      node: schemaNode,
      name,
      description,
      keysToOmit,
    }: {
      node: SchemaNode | null
      name: string
      description?: string
      keysToOmit?: Array<string>
    }) {
      if (!schemaNode) {
        return null
      }

      const transformedNode = transform(schemaNode, composeTransformers(...transformers))

      const imports = adapter.getImports(transformedNode, (schemaName) => ({
        name: resolveImportName(schemaName),
        path: resolver.resolveFile({ name: schemaName, extname: '.ts' }, { root, output, group }).path,
      }))

      return (
        <>
          {mode === 'split' &&
            imports.map((imp) => <File.Import key={[name, imp.path, imp.isTypeOnly].join('-')} root={file.path} path={imp.path} name={imp.name} isTypeOnly />)}
          <Type
            name={name}
            node={transformedNode}
            description={description}
            enumType={enumType}
            enumTypeSuffix={enumTypeSuffix}
            enumKeyCasing={enumKeyCasing}
            optionalType={optionalType}
            arrayType={arrayType}
            syntaxType={syntaxType}
            resolver={resolver}
            keysToOmit={keysToOmit}
            enumSchemaNames={enumSchemaNames}
          />
        </>
      )
    }

    const paramTypes = params.map((param) =>
      renderSchemaType({
        node: param.schema,
        name: resolver.resolveParamName(node, param),
      }),
    )

    const requestType = node.requestBody?.schema
      ? renderSchemaType({
          node: node.requestBody.schema,
          name: resolver.resolveDataName(node),
          description: node.requestBody.description ?? node.requestBody.schema.description,
          keysToOmit: node.requestBody.keysToOmit,
        })
      : null

    const responseTypes = node.responses.map((res) =>
      renderSchemaType({
        node: res.schema,
        name: resolver.resolveResponseStatusName(node, res.statusCode),
        description: res.description,
        keysToOmit: res.keysToOmit,
      }),
    )

    const dataType = renderSchemaType({
      node: buildData({ node: { ...node, parameters: params }, resolver }),
      name: resolver.resolveRequestConfigName(node),
    })

    const responsesType = renderSchemaType({
      node: buildResponses({ node, resolver }),
      name: resolver.resolveResponsesName(node),
    })

    const responseType = renderSchemaType({
      node: buildResponseUnion({ node, resolver }),
      name: resolver.resolveResponseName(node),
      description: 'Union of all possible responses',
    })

    return (
      <File
        baseName={file.baseName}
        path={file.path}
        meta={file.meta}
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
  Schema({ node, adapter, options, config, resolver }) {
    const { enumType, enumTypeSuffix, enumKeyCasing, syntaxType, optionalType, arrayType, output, group, transformers = [] } = options

    const root = path.resolve(config.root, config.output.path)
    const mode = getMode(path.resolve(root, output.path))

    if (!node.name) {
      return
    }

    const transformedNode = transform(node, composeTransformers(...transformers))

    // Build a set of schema names that are enums so the ref handler and getImports
    // callback can use the suffixed type name (e.g. `StatusKey`) for those refs.
    const enumSchemaNames = new Set((adapter.rootNode?.schemas ?? []).filter((s) => narrowSchema(s, schemaTypes.enum) && s.name).map((s) => s.name!))

    function resolveImportName(schemaName: string): string {
      if (ENUM_TYPES_WITH_KEY_SUFFIX.has(enumType) && enumTypeSuffix && enumSchemaNames.has(schemaName)) {
        return resolver.resolveEnumKeyName({ name: schemaName } as SchemaNode, enumTypeSuffix)
      }
      return resolver.default(schemaName, 'type')
    }

    const imports = adapter.getImports(transformedNode, (schemaName) => ({
      name: resolveImportName(schemaName),
      path: resolver.resolveFile({ name: schemaName, extname: '.ts' }, { root, output, group }).path,
    }))

    const isEnumSchema = !!narrowSchema(node, schemaTypes.enum)

    const name = ENUM_TYPES_WITH_KEY_SUFFIX.has(enumType) && isEnumSchema ? resolver.resolveEnumKeyName(node, enumTypeSuffix) : resolver.resolveName(node.name)

    const type = {
      name,
      file: resolver.resolveFile({ name: node.name, extname: '.ts' }, { root, output, group }),
    } as const

    return (
      <File
        baseName={type.file.baseName}
        path={type.file.path}
        meta={type.file.meta}
        banner={resolver.resolveBanner(adapter.rootNode, { output, config })}
        footer={resolver.resolveFooter(adapter.rootNode, { output, config })}
      >
        {mode === 'split' &&
          imports.map((imp) => (
            <File.Import key={[node.name, imp.path, imp.isTypeOnly].join('-')} root={type.file.path} path={imp.path} name={imp.name} isTypeOnly />
          ))}
        <Type
          name={type.name}
          node={transformedNode}
          enumType={enumType}
          enumTypeSuffix={enumTypeSuffix}
          enumKeyCasing={enumKeyCasing}
          optionalType={optionalType}
          arrayType={arrayType}
          syntaxType={syntaxType}
          resolver={resolver}
          enumSchemaNames={enumSchemaNames}
        />
      </File>
    )
  },
})
