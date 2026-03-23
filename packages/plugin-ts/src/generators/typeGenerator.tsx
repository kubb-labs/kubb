import { applyParamsCasing } from '@kubb/ast'
import type { SchemaNode } from '@kubb/ast/types'
import { defineGenerator } from '@kubb/core'
import { useKubb } from '@kubb/core/hooks'
import { File } from '@kubb/react-fabric'
import { Type } from '../components/Type.tsx'
import { ENUM_TYPES_WITH_KEY_SUFFIX } from '../constants.ts'
import type { PluginTs } from '../types'
import {
  buildDataSchemaNode,
  buildGroupedParamsSchema,
  buildLegacyResponsesSchemaNode,
  buildLegacyResponseUnionSchemaNode,
  buildResponsesSchemaNode,
  buildResponseUnionSchemaNode,
  nameUnnamedEnums,
} from './utils.ts'

export const typeGenerator = defineGenerator<PluginTs>({
  name: 'typescript',
  type: 'react',
  Operation({ node, adapter, options }) {
    const { enumType, enumKeyCasing, optionalType, arrayType, syntaxType, paramsCasing, group, resolver, baseResolver, legacy } = options
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

      const imports = adapter.getImports(schemaNode, (schemaName) => ({
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
            node={schemaNode}
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

    const responseTypes = legacy
      ? node.responses.map((res) => {
          const responseName = resolver.resolveResponseStatusName(node, res.statusCode)
          const baseResponseName = (baseResolver ?? resolver).resolveResponseStatusName(node, res.statusCode)

          return renderSchemaType({
            node: res.schema ? nameUnnamedEnums(res.schema, baseResponseName) : res.schema,
            name: responseName,
            typedName: resolver.resolveResponseStatusTypedName(node, res.statusCode),
            description: res.description,
            keysToOmit: res.keysToOmit,
          })
        })
      : node.responses.map((res) =>
          renderSchemaType({
            node: res.schema,
            name: resolver.resolveResponseStatusName(node, res.statusCode),
            typedName: resolver.resolveResponseStatusTypedName(node, res.statusCode),
            description: res.description,
            keysToOmit: res.keysToOmit,
          }),
        )

    const requestType = node.requestBody?.schema
      ? renderSchemaType({
          node: legacy ? nameUnnamedEnums(node.requestBody.schema, (baseResolver ?? resolver).resolveDataName(node)) : node.requestBody.schema,
          name: resolver.resolveDataName(node),
          typedName: resolver.resolveDataTypedName(node),
          description: node.requestBody.description ?? node.requestBody.schema.description,
          keysToOmit: node.requestBody.keysToOmit,
        })
      : null

    if (legacy) {
      const pathParams = params.filter((p) => p.in === 'path')
      const queryParams = params.filter((p) => p.in === 'query')
      const headerParams = params.filter((p) => p.in === 'header')

      const legacyParamTypes = [
        pathParams.length > 0
          ? renderSchemaType({
              node: buildGroupedParamsSchema({ params: pathParams, parentName: (baseResolver ?? resolver).resolvePathParamsName!(node) }),
              name: resolver.resolvePathParamsName!(node),
              typedName: resolver.resolvePathParamsTypedName!(node),
            })
          : null,
        queryParams.length > 0
          ? renderSchemaType({
              node: buildGroupedParamsSchema({ params: queryParams, parentName: (baseResolver ?? resolver).resolveQueryParamsName!(node) }),
              name: resolver.resolveQueryParamsName!(node),
              typedName: resolver.resolveQueryParamsTypedName!(node),
            })
          : null,
        headerParams.length > 0
          ? renderSchemaType({
              node: buildGroupedParamsSchema({ params: headerParams, parentName: (baseResolver ?? resolver).resolveHeaderParamsName!(node) }),
              name: resolver.resolveHeaderParamsName!(node),
              typedName: resolver.resolveHeaderParamsTypedName!(node),
            })
          : null,
      ]

      const legacyResponsesType = renderSchemaType({
        node: buildLegacyResponsesSchemaNode({ node, resolver }),
        name: resolver.resolveResponsesName(node),
        typedName: resolver.resolveResponsesTypedName(node),
      })

      const legacyResponseType = renderSchemaType({
        node: buildLegacyResponseUnionSchemaNode({ node, resolver }),
        name: resolver.resolveResponseName(node),
        typedName: resolver.resolveResponseTypedName(node),
      })

      return (
        <File baseName={file.baseName} path={file.path} meta={file.meta} banner={resolveBanner()} footer={resolveFooter()}>
          {legacyParamTypes}
          {responseTypes}
          {requestType}
          {legacyResponseType}
          {legacyResponsesType}
        </File>
      )
    }

    const paramTypes = params.map((param) =>
      renderSchemaType({
        node: param.schema,
        name: resolver.resolveParamName(node, param),
        typedName: resolver.resolveParamTypedName(node, param),
      }),
    )

    const dataType = renderSchemaType({
      node: buildDataSchemaNode({ node: { ...node, parameters: params }, resolver }),
      name: resolver.resolveRequestConfigName(node),
      typedName: resolver.resolveRequestConfigTypedName(node),
    })

    const responsesType = renderSchemaType({
      node: buildResponsesSchemaNode({ node, resolver }),
      name: resolver.resolveResponsesName(node),
      typedName: resolver.resolveResponsesTypedName(node),
    })

    const responseType = renderSchemaType({
      node: buildResponseUnionSchemaNode({ node, resolver }),
      name: resolver.resolveResponseName(node),
      typedName: resolver.resolveResponseTypedName(node),
      description: 'Union of all possible responses',
    })

    return (
      <File baseName={file.baseName} path={file.path} meta={file.meta} banner={resolveBanner()} footer={resolveFooter()}>
        {paramTypes}
        {responseTypes}
        {requestType}
        {dataType}
        {responsesType}
        {responseType}
      </File>
    )
  },
  Schema({ node, adapter, options }) {
    const { enumType, enumKeyCasing, syntaxType, optionalType, arrayType, resolver } = options
    const { mode, getFile, resolveBanner, resolveFooter } = useKubb<PluginTs>()

    if (!node.name) {
      return
    }

    const imports = adapter.getImports(node, (schemaName) => ({
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
          node={node}
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
