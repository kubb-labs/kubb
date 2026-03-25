import { caseParams, composeTransformers, createProperty, createSchema, narrowSchema, schemaTypes, transform } from '@kubb/ast'
import type { OperationNode, ParameterNode, SchemaNode } from '@kubb/ast/types'
import { defineGenerator } from '@kubb/core'
import { useKubb } from '@kubb/core/hooks'
import { File } from '@kubb/react-fabric'
import { Type } from '../components/Type.tsx'
import { ENUM_TYPES_WITH_SUFFIX } from '../constants.ts'
import type { PluginTs, ResolverTs } from '../types'

type BuildParamsSchemaOptions = {
  params: Array<ParameterNode>
  node: OperationNode
  resolver: ResolverTs
}

function buildParamsSchema({ params, node, resolver }: BuildParamsSchemaOptions): SchemaNode {
  return createSchema({
    type: 'object',
    properties: params.map((param) =>
      createProperty({
        name: param.name,
        required: param.required,
        schema: createSchema({
          type: 'ref',
          name: resolver.resolveParamName(node, param),
        }),
      }),
    ),
  })
}

type BuildOperationSchemaOptions = {
  node: OperationNode
  resolver: ResolverTs
}

function buildDataSchemaNode({ node, resolver }: BuildOperationSchemaOptions): SchemaNode {
  const pathParams = node.parameters.filter((p) => p.in === 'path')
  const queryParams = node.parameters.filter((p) => p.in === 'query')
  const headerParams = node.parameters.filter((p) => p.in === 'header')

  return createSchema({
    type: 'object',
    deprecated: node.deprecated,
    properties: [
      createProperty({
        name: 'data',
        schema: node.requestBody?.schema
          ? createSchema({
              type: 'ref',
              name: resolver.resolveDataTypedName(node),
              optional: true,
            })
          : createSchema({ type: 'never', optional: true }),
      }),
      createProperty({
        name: 'pathParams',
        required: pathParams.length > 0,
        schema: pathParams.length > 0 ? buildParamsSchema({ params: pathParams, node, resolver }) : createSchema({ type: 'never' }),
      }),
      createProperty({
        name: 'queryParams',
        schema:
          queryParams.length > 0
            ? createSchema({ ...buildParamsSchema({ params: queryParams, node, resolver }), optional: true })
            : createSchema({ type: 'never', optional: true }),
      }),
      createProperty({
        name: 'headerParams',
        schema:
          headerParams.length > 0
            ? createSchema({ ...buildParamsSchema({ params: headerParams, node, resolver }), optional: true })
            : createSchema({ type: 'never', optional: true }),
      }),
      createProperty({
        name: 'url',
        required: true,
        schema: createSchema({ type: 'url', path: node.path }),
      }),
    ],
  })
}

function buildResponsesSchemaNode({ node, resolver }: BuildOperationSchemaOptions): SchemaNode | null {
  if (node.responses.length === 0) {
    return null
  }

  return createSchema({
    type: 'object',
    properties: node.responses.map((res) =>
      createProperty({
        name: String(res.statusCode),
        required: true,
        schema: createSchema({
          type: 'ref',
          name: resolver.resolveResponseStatusTypedName(node, res.statusCode),
        }),
      }),
    ),
  })
}

function buildResponseUnionSchemaNode({ node, resolver }: BuildOperationSchemaOptions): SchemaNode | null {
  const responsesWithSchema = node.responses.filter((res) => res.schema)

  if (responsesWithSchema.length === 0) {
    return null
  }

  return createSchema({
    type: 'union',
    members: responsesWithSchema.map((res) =>
      createSchema({
        type: 'ref',
        name: resolver.resolveResponseStatusTypedName(node, res.statusCode),
      }),
    ),
  })
}

export const typeGenerator = defineGenerator<PluginTs>({
  name: 'typescript',
  type: 'react',
  Operation({ node, adapter, options }) {
    const {
      enumType,
      enumKeyCasing,
      enumTypeSuffix,
      optionalType,
      arrayType,
      syntaxType,
      paramsCasing,
      group,
      resolver,
      transformers = [],
    } = options
    const { mode, getFile, resolveBanner, resolveFooter } = useKubb<PluginTs>()

    const file = getFile({
      name: node.operationId,
      extname: '.ts',
      mode,
      options: {
        group: group ? (group.type === 'tag' ? { tag: node.tags[0] ?? 'default' } : { path: node.path }) : undefined,
      },
    })
    const params = caseParams(node.parameters, paramsCasing)

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
            enumTypeSuffix={enumTypeSuffix}
            optionalType={optionalType}
            arrayType={arrayType}
            syntaxType={syntaxType}
            resolver={resolver}
            keysToOmit={keysToOmit}
          />
        </>
      )
    }

    const paramTypes = params.map((param) =>
      renderSchemaType({
        node: param.schema,
        name: resolver.resolveParamName(node, param),
        typedName: resolver.resolveParamTypedName(node, param),
      }),
    )

    const queryParamsList = params.filter((p) => p.in === 'query')
    const queryParamsType =
      queryParamsList.length > 0
        ? renderSchemaType({
            node: buildParamsSchema({ params: queryParamsList, node, resolver }),
            name: resolver.resolveQueryParamsName!(node),
            typedName: resolver.resolveQueryParamsTypedName!(node),
          })
        : null

    const requestType = node.requestBody?.schema
      ? renderSchemaType({
          node: node.requestBody.schema,
          name: resolver.resolveDataName(node),
          typedName: resolver.resolveDataTypedName(node),
          description: node.requestBody.description ?? node.requestBody.schema.description,
          keysToOmit: node.requestBody.keysToOmit,
        })
      : null

    const responseTypes = node.responses.map((res) =>
      renderSchemaType({
        node: res.schema,
        name: resolver.resolveResponseStatusName(node, res.statusCode),
        typedName: resolver.resolveResponseStatusTypedName(node, res.statusCode),
        description: res.description,
        keysToOmit: res.keysToOmit,
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
        {queryParamsType}
        {responseTypes}
        {requestType}
        {dataType}
        {responsesType}
        {responseType}
      </File>
    )
  },
  Schema({ node, adapter, options }) {
    const { enumType, enumKeyCasing, enumTypeSuffix, syntaxType, optionalType, arrayType, resolver, transformers = [] } = options
    const { mode, getFile, resolveBanner, resolveFooter } = useKubb<PluginTs>()

    if (!node.name) {
      return
    }

    const transformedNode = transform(node, composeTransformers(...transformers))

    const imports = adapter.getImports(transformedNode, (schemaName) => ({
      name: resolver.default(schemaName, 'type'),
      path: getFile({ name: schemaName, extname: '.ts', mode }).path,
    }))

    const isEnumSchema = !!narrowSchema(node, schemaTypes.enum)

    const typedName = ENUM_TYPES_WITH_SUFFIX.has(enumType) && isEnumSchema ? resolver.resolveEnumKeyTypedName(node) : resolver.resolveTypedName(node.name)

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
          enumTypeSuffix={enumTypeSuffix}
          optionalType={optionalType}
          arrayType={arrayType}
          syntaxType={syntaxType}
          resolver={resolver}
        />
      </File>
    )
  },
})
