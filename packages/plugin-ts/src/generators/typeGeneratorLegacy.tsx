import { applyParamsCasing, composeTransformers, transform } from '@kubb/ast'
import type { SchemaNode } from '@kubb/ast/types'
import { defineGenerator } from '@kubb/core'
import { useKubb } from '@kubb/core/hooks'
import { File } from '@kubb/react-fabric'
import { Type } from '../components/Type.tsx'
import type { PluginTs } from '../types'
import { typeGenerator } from './typeGenerator.tsx'
import {
  buildGroupedParamsSchema,
  buildLegacyResponsesSchemaNode,
  buildLegacyResponseUnionSchemaNode,
  nameUnnamedEnums,
} from './utils.ts'

/**
 * Legacy variant of `typeGenerator` that reproduces the v4 grouped-params / Mutation-Query
 * response-namespace output shape. Selected automatically when `legacy: true` is set in
 * plugin options; the standard `typeGenerator` is used otherwise.
 *
 * The `Schema` handler is shared with `typeGenerator` — only the `Operation` handler
 * differs to produce the legacy structural layout.
 *
 * @deprecated Will be removed when `legacy` support is dropped in v6.
 */
export const typeGeneratorLegacy = defineGenerator<PluginTs>({
  name: 'typescript',
  type: 'react',
  Schema: typeGenerator.Schema,
  Operation({ node, adapter, options }) {
    const { enumType, enumKeyCasing, optionalType, arrayType, syntaxType, paramsCasing, group, resolver, baseResolver, transformers = [] } = options
    const { mode, getFile, resolveBanner, resolveFooter } = useKubb<PluginTs>()

    const file = getFile({
      name: node.operationId,
      extname: '.ts',
      mode,
      options: {
        group: group ? (group.type === 'tag' ? { tag: node.tags[0] ?? 'default' } : { path: node.path }) : undefined,
      },
    })
    const params = applyParamsCasing(node.parameters, paramsCasing)

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

      const transformedNode = transform(schemaNode, composeTransformers(...transformers))

      const imports = adapter.getImports(transformedNode, (schemaName) => ({
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
            node={transformedNode}
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

    const pathParams = params.filter((p) => p.in === 'path')
    const queryParams = params.filter((p) => p.in === 'query')
    const headerParams = params.filter((p) => p.in === 'header')

    const responseTypes = node.responses.map((res) => {
      const responseName = resolver.resolveResponseStatusName(node, res.statusCode)
      const baseResponseName = baseResolver.resolveResponseStatusName(node, res.statusCode)

      return renderSchemaType({
        node: res.schema ? nameUnnamedEnums(res.schema, baseResponseName) : res.schema,
        name: responseName,
        typedName: resolver.resolveResponseStatusTypedName(node, res.statusCode),
        description: res.description,
        keysToOmit: res.keysToOmit,
      })
    })

    const requestType = node.requestBody?.schema
      ? renderSchemaType({
          node: nameUnnamedEnums(node.requestBody.schema, baseResolver.resolveDataName(node)),
          name: resolver.resolveDataName(node),
          typedName: resolver.resolveDataTypedName(node),
          description: node.requestBody.description ?? node.requestBody.schema.description,
          keysToOmit: node.requestBody.keysToOmit,
        })
      : null

    const paramTypes = [
      pathParams.length > 0
        ? renderSchemaType({
            node: buildGroupedParamsSchema({ params: pathParams, parentName: baseResolver.resolvePathParamsName!(node) }),
            name: resolver.resolvePathParamsName!(node),
            typedName: resolver.resolvePathParamsTypedName!(node),
          })
        : null,
      queryParams.length > 0
        ? renderSchemaType({
            node: buildGroupedParamsSchema({ params: queryParams, parentName: baseResolver.resolveQueryParamsName!(node) }),
            name: resolver.resolveQueryParamsName!(node),
            typedName: resolver.resolveQueryParamsTypedName!(node),
          })
        : null,
      headerParams.length > 0
        ? renderSchemaType({
            node: buildGroupedParamsSchema({ params: headerParams, parentName: baseResolver.resolveHeaderParamsName!(node) }),
            name: resolver.resolveHeaderParamsName!(node),
            typedName: resolver.resolveHeaderParamsTypedName!(node),
          })
        : null,
    ]

    const responsesType = renderSchemaType({
      node: buildLegacyResponsesSchemaNode({ node, resolver }),
      name: resolver.resolveResponsesName(node),
      typedName: resolver.resolveResponsesTypedName(node),
    })

    const responseType = renderSchemaType({
      node: buildLegacyResponseUnionSchemaNode({ node, resolver }),
      name: resolver.resolveResponseName(node),
      typedName: resolver.resolveResponseTypedName(node),
    })

    return (
      <File baseName={file.baseName} path={file.path} meta={file.meta} banner={resolveBanner()} footer={resolveFooter()}>
        {paramTypes}
        {responseTypes}
        {requestType}
        {responseType}
        {responsesType}
      </File>
    )
  },
})
