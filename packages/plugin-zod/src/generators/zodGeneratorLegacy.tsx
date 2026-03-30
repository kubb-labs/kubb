import path from 'node:path'
import { pascalCase } from '@internals/utils'
import { caseParams, composeTransformers, createProperty, createSchema, transform } from '@kubb/ast'
import type { OperationNode, ParameterNode, SchemaNode } from '@kubb/ast/types'
import { defineGenerator, getMode } from '@kubb/core'
import { File } from '@kubb/react-fabric'
import { Zod } from '../components/Zod.tsx'
import { ZodMini } from '../components/ZodMini.tsx'
import { ZOD_NAMESPACE_IMPORTS } from '../constants.ts'
import type { PluginZod, ResolverZod } from '../types'

type BuildGroupedParamsSchemaOptions = {
  params: Array<ParameterNode>
}

function buildGroupedParamsSchema({ params }: BuildGroupedParamsSchemaOptions): SchemaNode {
  return createSchema({
    type: 'object',
    properties: params.map((param) => {
      return createProperty({
        name: param.name,
        required: param.required,
        schema: param.schema,
      })
    }),
  })
}

type BuildOperationSchemaOptions = {
  node: OperationNode
  resolver: ResolverZod
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

export const zodGeneratorLegacy = defineGenerator<PluginZod>({
  name: 'zod-legacy',
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

    const imports = adapter.getImports(schemaNode, (schemaName) => ({
      name: resolver.default(schemaName, 'function'),
      path: resolver.resolveFile({ name: schemaName, extname: '.ts' }, { root, output, group }).path,
    }))

    const isZodImport = ZOD_NAMESPACE_IMPORTS.has(importPath as 'zod' | 'zod/mini')
    const inferTypeName = inferred ? resolver.default(node.name, 'type') : undefined

    return (
      <File
        baseName={file.baseName}
        path={file.path}
        meta={file.meta}
        banner={resolver.resolveBanner(adapter.rootNode, { output, config })}
        footer={resolver.resolveFooter(adapter.rootNode, { output, config })}
      >
        <File.Import name={isZodImport ? 'z' : ['z']} path={importPath} isNameSpace={isZodImport} />
        {mode === 'split' &&
          imports.map((imp) => <File.Import key={[node.name, imp.path].join('-')} root={file.path} path={imp.path} name={imp.name} />)}

        {mini ? (
          <ZodMini
            name={zodName}
            node={schemaNode}
            guidType={guidType}
            wrapOutput={wrapOutput}
            description={schemaNode.description}
            inferTypeName={inferTypeName}
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

    function renderSchemaEntry({
      schema,
      name,
      description,
    }: {
      schema: SchemaNode | null | undefined
      name: string
      description?: string
    }) {
      if (!schema) return null

      const inferTypeName = inferred ? pascalCase(name) : undefined

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
            />
          )}
        </>
      )
    }

    const pathParams = params.filter((p) => p.in === 'path')
    const queryParams = params.filter((p) => p.in === 'query')
    const headerParams = params.filter((p) => p.in === 'header')

    // Render response schemas
    const responseSchemas = node.responses.map((res) => {
      const responseName = resolver.resolveResponseStatusName(node, res.statusCode)
      return renderSchemaEntry({
        schema: res.schema,
        name: responseName,
        description: res.description,
      })
    })

    // Render request body schema
    const requestSchema = node.requestBody?.schema
      ? renderSchemaEntry({
          schema: node.requestBody.schema,
          name: resolver.resolveDataName(node),
          description: node.requestBody.description,
        })
      : null

    // Render grouped parameter schemas (legacy style)
    const legacyParamTypes = [
      pathParams.length > 0
        ? renderSchemaEntry({
            schema: buildGroupedParamsSchema({ params: pathParams }),
            name: resolver.resolvePathParamsName(node, pathParams[0]!),
          })
        : null,
      queryParams.length > 0
        ? renderSchemaEntry({
            schema: buildGroupedParamsSchema({ params: queryParams }),
            name: resolver.resolveQueryParamsName(node, queryParams[0]!),
          })
        : null,
      headerParams.length > 0
        ? renderSchemaEntry({
            schema: buildGroupedParamsSchema({ params: headerParams }),
            name: resolver.resolveHeaderParamsName(node, headerParams[0]!),
          })
        : null,
    ]

    // Legacy combined responses
    const legacyResponsesSchema = renderSchemaEntry({
      schema: buildLegacyResponsesSchemaNode({ node, resolver }),
      name: resolver.resolveResponsesName(node),
    })

    const legacyResponseSchema = renderSchemaEntry({
      schema: buildLegacyResponseUnionSchemaNode({ node, resolver }),
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
        <File.Import name={isZodImport ? 'z' : ['z']} path={importPath} isNameSpace={isZodImport} />
        {legacyParamTypes}
        {responseSchemas}
        {requestSchema}
        {legacyResponseSchema}
        {legacyResponsesSchema}
      </File>
    )
  },
})
