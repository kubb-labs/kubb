import { applyParamsCasing, composeTransformers, transform } from '@kubb/ast'
import type { SchemaNode } from '@kubb/ast/types'
import { defineGenerator } from '@kubb/core'
import { useKubb } from '@kubb/core/hooks'
import { File } from '@kubb/react-fabric'
import { Type } from '../components/Type.tsx'
import { ENUM_TYPES_WITH_KEY_SUFFIX } from '../constants.ts'
import type { PluginTs } from '../types'

export const typeGenerator = defineGenerator<PluginTs>({
  name: 'typescript',
  type: 'react',
  Operation({ node, adapter, options }) {
    const { enumType, enumKeyCasing, optionalType, arrayType, syntaxType, paramsCasing, group, resolver, transformers = [] } = options
    const { mode, getFile, resolveBanner, resolveFooter } = useKubb<PluginTs>()

    const file = getFile({
      name: node.operationId,
      extname: '.ts',
      mode,
      options: {
        group: group ? (group.type === 'tag' ? { tag: node.tags[0] ?? 'default' } : { path: node.path }) : undefined,
      },
    })

    // Apply paramsCasing to individual params first, then run all transformers (e.g. legacy
    // transformer applies nameUnnamedEnums to response/requestBody schemas).
    const params = applyParamsCasing(node.parameters, paramsCasing)
    const transformedNode = transform({ ...node, parameters: params }, composeTransformers(...transformers))

    function renderSchemaType({
      node: schemaNode,
      name,
      typedName,
      description,
      keysToOmit,
    }: {
      node: SchemaNode | null
      name: string
      typedName: string
      description?: string
      keysToOmit?: Array<string>
    }) {
      if (!schemaNode) {
        return null
      }

      // Apply schema-level transformers (e.g. user property/schema visitors).
      // Operation-level transformers have already been applied above; they are no-ops here.
      const transformedSchemaNode = transform(schemaNode, composeTransformers(...transformers))

      const imports = adapter.getImports(transformedSchemaNode, (schemaName) => ({
        name: resolver.default(schemaName, 'type'),
        path: getFile({ name: schemaName, extname: '.ts', mode }).path,
      }))

      return (
        <>
          {mode === 'split' &&
            imports.map((imp) => <File.Import key={[name, imp.path, imp.isTypeOnly].join('-')} root={file.path} path={imp.path} name={imp.name} isTypeOnly />)}
          <Type
            name={name}
            typedName={typedName}
            node={transformedSchemaNode}
            description={description}
            enumType={enumType}
            enumKeyCasing={enumKeyCasing}
            optionalType={optionalType}
            arrayType={arrayType}
            syntaxType={syntaxType}
            resolver={resolver}
            keysToOmit={keysToOmit}
          />
        </>
      )
    }

    const pathParams = transformedNode.parameters.filter((p) => p.in === 'path')
    const queryParams = transformedNode.parameters.filter((p) => p.in === 'query')
    const headerParams = transformedNode.parameters.filter((p) => p.in === 'header')

    // Detect legacy mode by checking whether the resolver supplies grouped-param builders.
    // In legacy mode the resolver defines buildPathParamsSchema; in non-legacy it does not.
    const isLegacyParamMode = typeof resolver.buildPathParamsSchema === 'function'

    // Individual param types — rendered only in non-legacy mode.
    const paramTypes = isLegacyParamMode
      ? []
      : transformedNode.parameters.map((param) =>
          renderSchemaType({
            node: param.schema,
            name: resolver.resolveParamName(transformedNode, param),
            typedName: resolver.resolveParamTypedName(transformedNode, param),
          }),
        )

    // Grouped path params — legacy only (resolver.buildPathParamsSchema is defined).
    const pathGroupedSchemaNode = resolver.buildPathParamsSchema?.(transformedNode, pathParams) ?? null
    const pathGroupedType = pathGroupedSchemaNode
      ? renderSchemaType({
          node: pathGroupedSchemaNode,
          name: resolver.resolvePathParamsName!(transformedNode),
          typedName: resolver.resolvePathParamsTypedName!(transformedNode),
        })
      : null

    // Query params — both modes, but with different schemas:
    //   non-legacy: ref-based aggregate (object of refs to individual query param types)
    //   legacy:     inline grouped object embedding each query param's schema directly
    const queryGroupedSchemaNode = resolver.buildQueryParamsSchema?.(transformedNode, queryParams) ?? null
    const queryGroupedType = queryGroupedSchemaNode
      ? renderSchemaType({
          node: queryGroupedSchemaNode,
          name: resolver.resolveQueryParamsName!(transformedNode),
          typedName: resolver.resolveQueryParamsTypedName!(transformedNode),
        })
      : null

    // Grouped header params — legacy only.
    const headerGroupedSchemaNode = resolver.buildHeaderParamsSchema?.(transformedNode, headerParams) ?? null
    const headerGroupedType = headerGroupedSchemaNode
      ? renderSchemaType({
          node: headerGroupedSchemaNode,
          name: resolver.resolveHeaderParamsName!(transformedNode),
          typedName: resolver.resolveHeaderParamsTypedName!(transformedNode),
        })
      : null

    const responseTypes = transformedNode.responses.map((res) =>
      renderSchemaType({
        node: res.schema,
        name: resolver.resolveResponseStatusName(transformedNode, res.statusCode),
        typedName: resolver.resolveResponseStatusTypedName(transformedNode, res.statusCode),
        description: res.description,
        keysToOmit: res.keysToOmit,
      }),
    )

    const requestType = transformedNode.requestBody?.schema
      ? renderSchemaType({
          node: transformedNode.requestBody.schema,
          name: resolver.resolveDataName(transformedNode),
          typedName: resolver.resolveDataTypedName(transformedNode),
          description: transformedNode.requestBody.description ?? transformedNode.requestBody.schema.description,
          keysToOmit: transformedNode.requestBody.keysToOmit,
        })
      : null

    // RequestConfig type — resolver returns null in legacy mode (not part of legacy output).
    const dataType = renderSchemaType({
      node: resolver.buildDataSchema?.(transformedNode) ?? null,
      name: resolver.resolveRequestConfigName(transformedNode),
      typedName: resolver.resolveRequestConfigTypedName(transformedNode),
    })

    // Response union — success-only in legacy (MutationResponse/QueryResponse), all in non-legacy.
    const responseType = renderSchemaType({
      node: resolver.buildResponseSchema?.(transformedNode) ?? null,
      name: resolver.resolveResponseName(transformedNode),
      typedName: resolver.resolveResponseTypedName(transformedNode),
    })

    // Responses aggregate — Mutation/Query namespace in legacy, keyed HTTP map in non-legacy.
    const responsesType = renderSchemaType({
      node: resolver.buildResponsesSchema?.(transformedNode) ?? null,
      name: resolver.resolveResponsesName(transformedNode),
      typedName: resolver.resolveResponsesTypedName(transformedNode),
    })

    return (
      <File baseName={file.baseName} path={file.path} meta={file.meta} banner={resolveBanner()} footer={resolveFooter()}>
        {paramTypes}
        {pathGroupedType}
        {queryGroupedType}
        {headerGroupedType}
        {responseTypes}
        {requestType}
        {dataType}
        {responseType}
        {responsesType}
      </File>
    )
  },
  Schema({ node, adapter, options }) {
    const { enumType, enumKeyCasing, syntaxType, optionalType, arrayType, resolver, transformers = [] } = options
    const { mode, getFile, resolveBanner, resolveFooter } = useKubb<PluginTs>()

    if (!node.name) {
      return
    }

    const transformedNode = transform(node, composeTransformers(...transformers))

    const imports = adapter.getImports(transformedNode, (schemaName) => ({
      name: resolver.default(schemaName, 'type'),
      path: getFile({ name: schemaName, extname: '.ts', mode }).path,
    }))

    const isEnumSchema = node.type === 'enum'

    const typedName = ENUM_TYPES_WITH_KEY_SUFFIX.has(enumType) && isEnumSchema ? resolver.resolveEnumKeyTypedName(node) : resolver.resolveTypedName(node.name)

    const type = {
      name: resolver.resolveName(node.name),
      typedName,
      file: getFile({ name: node.name, extname: '.ts', mode }),
    } as const

    return (
      <File baseName={type.file.baseName} path={type.file.path} meta={type.file.meta} banner={resolveBanner()} footer={resolveFooter()}>
        {mode === 'split' &&
          imports.map((imp) => (
            <File.Import key={[node.name, imp.path, imp.isTypeOnly].join('-')} root={type.file.path} path={imp.path} name={imp.name} isTypeOnly />
          ))}
        <Type
          name={type.name}
          typedName={type.typedName}
          node={transformedNode}
          enumType={enumType}
          enumKeyCasing={enumKeyCasing}
          optionalType={optionalType}
          arrayType={arrayType}
          syntaxType={syntaxType}
          resolver={resolver}
        />
      </File>
    )
  },
})
