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

    // Apply paramsCasing to individual params first, then run all transformers.
    // In legacy mode the createLegacyOperationTransformer replaces individual params with
    // synthetic grouped ParameterNodes ({in: 'path'/'query'/'header', name: 'Params'}) so the
    // uniform param loop below produces the correct legacy type names without any branching.
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

    // Uniform param loop — works for both modes without any branching:
    //   Non-legacy: individual params (e.g. {in: 'query', name: 'limit'}) → ListPetsQueryLimit
    //   Legacy:     synthetic grouped params (e.g. {in: 'query', name: 'Params'}) → ListPetsQueryParams
    const paramTypes = transformedNode.parameters.map((param) =>
      renderSchemaType({
        node: param.schema,
        name: resolver.resolveParamName(transformedNode, param),
        typedName: resolver.resolveParamTypedName(transformedNode, param),
      }),
    )

    // Aggregate QueryParams type — non-legacy: ref-based object; legacy: null (synthetic grouped param handles it).
    const queryParamsList = transformedNode.parameters.filter((p) => p.in === 'query')
    const queryParamsSchemaNode = resolver.buildQueryParamsSchema?.(transformedNode, queryParamsList) ?? null
    const queryParamsType = queryParamsSchemaNode
      ? renderSchemaType({
          node: queryParamsSchemaNode,
          name: resolver.resolveQueryParamsName?.(transformedNode) ?? '',
          typedName: resolver.resolveQueryParamsTypedName?.(transformedNode) ?? '',
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
        {queryParamsType}
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
