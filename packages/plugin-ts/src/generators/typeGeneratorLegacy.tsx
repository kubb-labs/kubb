import path from 'node:path'
import { pascalCase } from '@internals/utils'
import { caseParams, composeTransformers, createProperty, createSchema, narrowSchema, schemaTypes, transform } from '@kubb/ast'
import type { OperationNode, ParameterNode, SchemaNode } from '@kubb/ast/types'
import { defineGenerator, getMode } from '@kubb/core'
import { File } from '@kubb/react-fabric'
import { Type } from '../components/Type.tsx'
import { ENUM_TYPES_WITH_KEY_SUFFIX } from '../constants.ts'
import { resolverTsLegacy } from '../resolvers/resolverTsLegacy.ts'
import type { PluginTs, ResolverTs } from '../types'

type BuildGroupedParamsSchemaOptions = {
  params: Array<ParameterNode>
  parentName?: string
}

function buildGroupedParamsSchema({ params, parentName }: BuildGroupedParamsSchemaOptions): SchemaNode {
  return createSchema({
    type: 'object',
    properties: params.map((param) => {
      let schema = param.schema
      if (narrowSchema(schema, 'enum') && !schema.name && parentName) {
        schema = { ...schema, name: pascalCase([parentName, param.name, 'enum'].join(' ')) }
      }
      return createProperty({
        name: param.name,
        required: param.required,
        schema,
      })
    }),
  })
}

type BuildOperationSchemaOptions = {
  node: OperationNode
  resolver: ResolverTs
}

function buildLegacyResponsesSchemaNode({ node, resolver }: BuildOperationSchemaOptions): SchemaNode | null {
  const isGet = node.method.toLowerCase() === 'get'
  const successResponses = node.responses.filter((res) => {
    const code = Number(res.statusCode)
    return !Number.isNaN(code) && code >= 200 && code < 300
  })
  const errorResponses = node.responses.filter((res) => res.statusCode === 'default' || Number(res.statusCode) >= 400)

  const responseSchema =
    successResponses.length > 0
      ? successResponses.length === 1
        ? createSchema({ type: 'ref', name: resolver.resolveResponseStatusName(node, successResponses[0]!.statusCode) })
        : createSchema({
            type: 'union',
            members: successResponses.map((res) => createSchema({ type: 'ref', name: resolver.resolveResponseStatusName(node, res.statusCode) })),
          })
      : createSchema({ type: 'any' })

  const errorsSchema =
    errorResponses.length > 0
      ? errorResponses.length === 1
        ? createSchema({ type: 'ref', name: resolver.resolveResponseStatusName(node, errorResponses[0]!.statusCode) })
        : createSchema({
            type: 'union',
            members: errorResponses.map((res) => createSchema({ type: 'ref', name: resolver.resolveResponseStatusName(node, res.statusCode) })),
          })
      : createSchema({ type: 'any' })

  const properties = [createProperty({ name: 'Response', required: true, schema: responseSchema })]

  if (!isGet && node.requestBody?.schema) {
    properties.push(
      createProperty({
        name: 'Request',
        required: true,
        schema: createSchema({ type: 'ref', name: resolver.resolveDataName(node) }),
      }),
    )
  }

  const queryParam = node.parameters.find((p) => p.in === 'query')
  if (queryParam) {
    properties.push(
      createProperty({
        name: 'QueryParams',
        required: true,
        schema: createSchema({ type: 'ref', name: resolver.resolveQueryParamsName(node, queryParam) }),
      }),
    )
  }

  const pathParam = node.parameters.find((p) => p.in === 'path')
  if (pathParam) {
    properties.push(
      createProperty({
        name: 'PathParams',
        required: true,
        schema: createSchema({ type: 'ref', name: resolver.resolvePathParamsName(node, pathParam) }),
      }),
    )
  }

  const headerParam = node.parameters.find((p) => p.in === 'header')
  if (headerParam) {
    properties.push(
      createProperty({
        name: 'HeaderParams',
        required: true,
        schema: createSchema({ type: 'ref', name: resolver.resolveHeaderParamsName(node, headerParam) }),
      }),
    )
  }

  properties.push(createProperty({ name: 'Errors', required: true, schema: errorsSchema }))

  return createSchema({ type: 'object', properties })
}

function buildLegacyResponseUnionSchemaNode({ node, resolver }: BuildOperationSchemaOptions): SchemaNode {
  const successResponses = node.responses.filter((res) => {
    const code = Number(res.statusCode)
    return !Number.isNaN(code) && code >= 200 && code < 300
  })

  if (successResponses.length === 0) {
    return createSchema({ type: 'any' })
  }

  if (successResponses.length === 1) {
    return createSchema({ type: 'ref', name: resolver.resolveResponseStatusName(node, successResponses[0]!.statusCode) })
  }

  return createSchema({
    type: 'union',
    members: successResponses.map((res) => createSchema({ type: 'ref', name: resolver.resolveResponseStatusName(node, res.statusCode) })),
  })
}

function nameUnnamedEnums(node: SchemaNode, parentName: string): SchemaNode {
  return transform(node, {
    schema(n) {
      const enumNode = narrowSchema(n, 'enum')
      if (enumNode && !enumNode.name) {
        return { ...enumNode, name: pascalCase([parentName, 'enum'].join(' ')) }
      }
      return undefined
    },
    property(p) {
      const enumNode = narrowSchema(p.schema, 'enum')
      if (enumNode && !enumNode.name) {
        return {
          ...p,
          schema: { ...enumNode, name: pascalCase([parentName, p.name, 'enum'].join(' ')) },
        }
      }
      return undefined
    },
  })
}

export const typeGeneratorLegacy = defineGenerator<PluginTs>({
  name: 'typescript-legacy',
  type: 'react',
  Operation({ node, adapter, options, config, resolver }) {
    const { enumType, enumTypeSuffix, enumKeyCasing, optionalType, arrayType, syntaxType, paramsCasing, group, output, transformers = [] } = options

    const root = path.resolve(config.root, config.output.path)
    const mode = getMode(path.resolve(root, output.path))

    const file = resolver.resolveFile({ name: node.operationId, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path }, { root, output, group })
    const params = caseParams(node.parameters, paramsCasing)

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
        name: resolver.default(schemaName, 'type'),
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
          />
        </>
      )
    }

    const pathParams = params.filter((p) => p.in === 'path')
    const queryParams = params.filter((p) => p.in === 'query')
    const headerParams = params.filter((p) => p.in === 'header')

    const responseTypes = node.responses.map((res) => {
      const responseName = resolver.resolveResponseStatusName(node, res.statusCode)
      const baseResponseName = resolverTsLegacy.resolveResponseStatusName(node, res.statusCode)

      return renderSchemaType({
        node: res.schema ? nameUnnamedEnums(res.schema, baseResponseName) : res.schema,
        name: responseName,
        description: res.description,
        keysToOmit: res.keysToOmit,
      })
    })

    const requestType = node.requestBody?.schema
      ? renderSchemaType({
          node: nameUnnamedEnums(node.requestBody.schema, resolverTsLegacy.resolveDataName(node)),
          name: resolver.resolveDataName(node),
          description: node.requestBody.description ?? node.requestBody.schema.description,
          keysToOmit: node.requestBody.keysToOmit,
        })
      : null

    const legacyParamTypes = [
      pathParams.length > 0
        ? renderSchemaType({
            node: buildGroupedParamsSchema({ params: pathParams, parentName: resolverTsLegacy.resolvePathParamsName(node, pathParams[0]!) }),
            name: resolver.resolvePathParamsName(node, pathParams[0]!),
          })
        : null,
      queryParams.length > 0
        ? renderSchemaType({
            node: buildGroupedParamsSchema({ params: queryParams, parentName: resolverTsLegacy.resolveQueryParamsName(node, queryParams[0]!) }),
            name: resolver.resolveQueryParamsName(node, queryParams[0]!),
          })
        : null,
      headerParams.length > 0
        ? renderSchemaType({
            node: buildGroupedParamsSchema({ params: headerParams, parentName: resolverTsLegacy.resolveHeaderParamsName(node, headerParams[0]!) }),
            name: resolver.resolveHeaderParamsName(node, headerParams[0]!),
          })
        : null,
    ]

    const legacyResponsesType = renderSchemaType({
      node: buildLegacyResponsesSchemaNode({ node, resolver }),
      name: resolver.resolveResponsesName(node),
    })

    const legacyResponseType = renderSchemaType({
      node: buildLegacyResponseUnionSchemaNode({ node, resolver }),
      name: resolver.resolveResponseName(node),
    })

    return (
      <File
        baseName={file.baseName}
        path={file.path}
        meta={file.meta}
        banner={resolver.resolveBanner(adapter.rootNode, { output, config })}
        footer={resolver.resolveFooter(adapter.rootNode, { output, config })}
      >
        {legacyParamTypes}
        {responseTypes}
        {requestType}
        {legacyResponseType}
        {legacyResponsesType}
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

    const imports = adapter.getImports(transformedNode, (schemaName) => ({
      name: resolver.default(schemaName, 'type'),
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
        />
      </File>
    )
  },
})
