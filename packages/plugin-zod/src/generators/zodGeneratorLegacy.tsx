import path from 'node:path'
import { caseParams, composeTransformers, createProperty, createSchema, transform } from '@kubb/ast'
import type { OperationNode, ParameterNode, SchemaNode } from '@kubb/ast/types'
import { defineGenerator, getMode } from '@kubb/core'
import type { KubbFile } from '@kubb/fabric-core/types'
import { File } from '@kubb/react-fabric'
import { Operations } from '../components/Operations.tsx'
import { Zod } from '../components/Zod.tsx'
import { ZodMini } from '../components/ZodMini.tsx'
import { OPERATIONS_FILENAME, ZOD_NAMESPACE_IMPORTS } from '../constants.ts'
import type { PluginZod, ResolverZod } from '../types'

type BuildGroupedParamsSchemaOptions = {
  params: Array<ParameterNode>
}

function buildGroupedParamsSchema({ params, optional }: BuildGroupedParamsSchemaOptions & { optional?: boolean }): SchemaNode {
  return createSchema({
    type: 'object',
    optional,
    primitive: 'object',
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

  return createSchema({ type: 'object', primitive: 'object', properties })
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

function buildLegacySchemaNames(node: OperationNode, params: Array<ParameterNode>, resolver: ResolverZod) {
  const pathParam = params.find((p) => p.in === 'path')
  const queryParam = params.find((p) => p.in === 'query')
  const headerParam = params.find((p) => p.in === 'header')

  const responses: Record<number | string, string> = {}
  const errors: Record<number | string, string> = {}

  for (const res of node.responses) {
    const name = resolver.resolveResponseStatusName(node, res.statusCode)
    const statusNum = Number(res.statusCode)

    if (!Number.isNaN(statusNum)) {
      responses[statusNum] = name
      if (statusNum >= 400) {
        errors[statusNum] = name
      }
    }
  }

  responses['default'] = resolver.resolveResponseName(node)

  return {
    request: node.requestBody?.schema ? resolver.resolveDataName(node) : undefined,
    parameters: {
      path: pathParam ? resolver.resolvePathParamsName(node, pathParam) : undefined,
      query: queryParam ? resolver.resolveQueryParamsName(node, queryParam) : undefined,
      header: headerParam ? resolver.resolveHeaderParamsName(node, headerParam) : undefined,
    },
    responses,
    errors,
  }
}

export const zodGeneratorLegacy = defineGenerator<PluginZod>({
  name: 'zod-legacy',
  type: 'react',
  Schema({ node, adapter, options, config, resolver }) {
    const { output, coercion, guidType, mini, wrapOutput, inferred, importPath, group, transformers = [] } = options

    const root = path.resolve(config.root, config.output.path)
    const mode = getMode(path.resolve(root, output.path))
    const isZodImport = ZOD_NAMESPACE_IMPORTS.has(importPath as 'zod' | 'zod/mini')

    if (!node.name) {
      return
    }

    const resolveZodFile = (name: string, tag?: string, opPath?: string) =>
      resolver.resolveFile({ name, extname: '.ts', tag, path: opPath }, { root, output, group })

    const schemaNode = transform(node, composeTransformers(...transformers))
    const zodName = resolver.default(schemaNode.name!, 'function')
    const file = resolveZodFile(node.name)

    const imports = adapter.getImports(schemaNode, (schemaName) => ({
      name: resolver.default(schemaName, 'function'),
      path: resolveZodFile(schemaName).path,
    }))

    const inferTypeName = inferred ? resolver.resolveInferName(resolver.resolveName(node.name)) : undefined

    return (
      <File
        baseName={file.baseName}
        path={file.path}
        meta={file.meta}
        banner={resolver.resolveBanner(adapter.rootNode, { output, config })}
        footer={resolver.resolveFooter(adapter.rootNode, { output, config })}
      >
        <File.Import name={isZodImport ? 'z' : ['z']} path={importPath} isNameSpace={isZodImport} />
        {mode === 'split' && imports.map((imp) => <File.Import key={[node.name, imp.path].join('-')} root={file.path} path={imp.path} name={imp.name} />)}

        {mini ? (
          <ZodMini
            name={zodName}
            node={schemaNode}
            guidType={guidType}
            wrapOutput={wrapOutput}
            description={schemaNode.description}
            inferTypeName={inferTypeName}
            resolver={resolver}
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
            resolver={resolver}
          />
        )}
      </File>
    )
  },
  Operation({ node, adapter, options, config, resolver }) {
    const { output, coercion, guidType, mini, wrapOutput, inferred, importPath, group, paramsCasing } = options

    const root = path.resolve(config.root, config.output.path)
    const mode = getMode(path.resolve(root, output.path))
    const isZodImport = ZOD_NAMESPACE_IMPORTS.has(importPath as 'zod' | 'zod/mini')

    const resolveZodFile = (name: string, tag?: string, opPath?: string) =>
      resolver.resolveFile({ name, extname: '.ts', tag, path: opPath }, { root, output, group })

    const file = resolveZodFile(node.operationId, node.tags[0] ?? 'default', node.path)

    const params = caseParams(node.parameters, paramsCasing)

    function renderSchemaEntry({
      schema,
      name,
      description,
      keysToOmit,
    }: {
      schema: SchemaNode | null | undefined
      name: string
      description?: string
      keysToOmit?: Array<string>
    }) {
      if (!schema) return null

      const inferTypeName = inferred ? resolver.resolveInferName(name) : undefined

      const imports = adapter.getImports(schema, (schemaName) => ({
        name: resolver.default(schemaName, 'function'),
        path: resolveZodFile(schemaName).path,
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
              resolver={resolver}
              keysToOmit={keysToOmit}
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
              resolver={resolver}
              keysToOmit={keysToOmit}
            />
          )}
        </>
      )
    }

    const pathParams = params.filter((p) => p.in === 'path')
    const queryParams = params.filter((p) => p.in === 'query')
    const headerParams = params.filter((p) => p.in === 'header')

    const responseSchemas = node.responses.map((res) => {
      const responseName = resolver.resolveResponseStatusName(node, res.statusCode)
      return renderSchemaEntry({ schema: res.schema, name: responseName, description: res.description, keysToOmit: res.keysToOmit })
    })

    const requestSchema = node.requestBody?.schema
      ? renderSchemaEntry({
          schema: node.requestBody.schema,
          name: resolver.resolveDataName(node),
          description: node.requestBody.description,
          keysToOmit: node.requestBody.keysToOmit,
        })
      : null

    const legacyParamTypes = [
      pathParams.length > 0
        ? renderSchemaEntry({
            schema: buildGroupedParamsSchema({ params: pathParams, optional: pathParams.every((p) => !p.required) }),
            name: resolver.resolvePathParamsName(node, pathParams[0]!),
          })
        : null,
      queryParams.length > 0
        ? renderSchemaEntry({
            schema: buildGroupedParamsSchema({ params: queryParams, optional: queryParams.every((p) => !p.required) }),
            name: resolver.resolveQueryParamsName(node, queryParams[0]!),
          })
        : null,
      headerParams.length > 0
        ? renderSchemaEntry({
            schema: buildGroupedParamsSchema({ params: headerParams, optional: headerParams.every((p) => !p.required) }),
            name: resolver.resolveHeaderParamsName(node, headerParams[0]!),
          })
        : null,
    ]

    const legacyResponsesSchema = renderSchemaEntry({ schema: buildLegacyResponsesSchemaNode({ node, resolver }), name: resolver.resolveResponsesName(node) })

    const legacyResponseSchema = renderSchemaEntry({ schema: buildLegacyResponseUnionSchemaNode({ node, resolver }), name: resolver.resolveResponseName(node) })

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
  Operations({ nodes, adapter, options, config, resolver }) {
    const { output, importPath, group, operations, paramsCasing } = options

    if (!operations) {
      return
    }

    const root = path.resolve(config.root, config.output.path)
    const isZodImport = ZOD_NAMESPACE_IMPORTS.has(importPath as 'zod' | 'zod/mini')
    const resolveZodFile = (name: string, tag?: string, opPath?: string) =>
      resolver.resolveFile({ name, extname: '.ts', tag, path: opPath }, { root, output, group })

    const filePath = resolver.resolvePath({ baseName: OPERATIONS_FILENAME, pathMode: getMode(path.resolve(root, output.path)) }, { root, output, group })
    const file: KubbFile.File = {
      path: filePath,
      baseName: OPERATIONS_FILENAME,
      meta: { pluginName: resolver.pluginName },
      sources: [],
      imports: [],
      exports: [],
    }

    const transformedOperations = nodes.map((node) => {
      const params = caseParams(node.parameters, paramsCasing)
      return {
        node,
        data: buildLegacySchemaNames(node, params, resolver),
      }
    })

    const operationFiles = nodes.map((node) => resolveZodFile(node.operationId, node.tags[0] ?? 'default', node.path))

    const imports = transformedOperations.flatMap(({ data }, index) => {
      const names = [data.request, ...Object.values(data.responses), ...Object.values(data.parameters)].filter(Boolean) as string[]
      const opFile = operationFiles[index]!
      return names.map((name) => <File.Import key={[name, opFile.path].join('-')} name={[name]} root={file.path} path={opFile.path} />)
    })

    return (
      <File
        baseName={file.baseName}
        path={file.path}
        meta={file.meta}
        banner={resolver.resolveBanner(adapter.rootNode, { output, config })}
        footer={resolver.resolveFooter(adapter.rootNode, { output, config })}
      >
        <File.Import isTypeOnly name={isZodImport ? 'z' : ['z']} path={importPath} isNameSpace={isZodImport} />
        {imports}
        <Operations name="operations" operations={transformedOperations} />
      </File>
    )
  },
})
