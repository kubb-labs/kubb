import path from 'node:path'
import { caseParams, createProperty, createSchema, transform } from '@kubb/ast'
import type { OperationNode, ParameterNode, SchemaNode } from '@kubb/ast/types'
import { defineGenerator, getMode } from '@kubb/core'
import { File } from '@kubb/react-fabric'
import { Operations } from '../components/Operations.tsx'
import { Zod } from '../components/Zod.tsx'
import { ZOD_NAMESPACE_IMPORTS } from '../constants.ts'
import { printerZod } from '../printers/printerZod.ts'
import { printerZodMini } from '../printers/printerZodMini.ts'
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
  resolver: ResolverZod
}

function buildLegacyResponsesSchemaNode(node: OperationNode, { resolver }: BuildOperationSchemaOptions): SchemaNode | null {
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

function buildLegacyResponseUnionSchemaNode(node: OperationNode, { resolver }: BuildOperationSchemaOptions): SchemaNode {
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
  schema(node, options) {
    const { adapter, config, resolver, plugin, root } = this
    const { output, coercion, guidType, mini, wrapOutput, inferred, importPath, group, printer } = options
    const transformedNode = plugin.transformer ? transform(node, plugin.transformer) : node

    if (!transformedNode.name) {
      return
    }

    const mode = getMode(path.resolve(root, output.path))
    const isZodImport = ZOD_NAMESPACE_IMPORTS.has(importPath as 'zod' | 'zod/mini')

    const imports = adapter.getImports(transformedNode, (schemaName) => ({
      name: resolver.resolveSchemaName(schemaName),
      path: resolver.resolveFile({ name: schemaName, extname: '.ts' }, { root, output, group }).path,
    }))

    const inferTypeName = inferred ? resolver.resolveSchemaTypeName(transformedNode.name) : undefined

    const meta = {
      name: resolver.resolveSchemaName(transformedNode.name),
      file: resolver.resolveFile({ name: transformedNode.name, extname: '.ts' }, { root, output, group }),
    } as const

    const schemaPrinter = mini
      ? printerZodMini({ guidType, wrapOutput, resolver, schemaName: meta.name, nodes: printer?.nodes })
      : printerZod({ coercion, guidType, wrapOutput, resolver, schemaName: meta.name, nodes: printer?.nodes })

    return (
      <File
        baseName={meta.file.baseName}
        path={meta.file.path}
        meta={meta.file.meta}
        banner={resolver.resolveBanner(adapter.rootNode, { output, config })}
        footer={resolver.resolveFooter(adapter.rootNode, { output, config })}
      >
        <File.Import name={isZodImport ? 'z' : ['z']} path={importPath} isNameSpace={isZodImport} />
        {mode === 'split' &&
          imports.map((imp) => <File.Import key={[transformedNode.name, imp.path].join('-')} root={meta.file.path} path={imp.path} name={imp.name} />)}

        <Zod name={meta.name} node={transformedNode} printer={schemaPrinter} inferTypeName={inferTypeName} />
      </File>
    )
  },
  operation(node, options) {
    const { adapter, config, resolver, plugin, root } = this
    const { output, coercion, guidType, mini, wrapOutput, inferred, importPath, group, paramsCasing, printer } = options

    const transformedNode = plugin.transformer ? transform(node, plugin.transformer) : node

    const mode = getMode(path.resolve(root, output.path))
    const isZodImport = ZOD_NAMESPACE_IMPORTS.has(importPath as 'zod' | 'zod/mini')

    const params = caseParams(transformedNode.parameters, paramsCasing)

    const meta = {
      file: resolver.resolveFile(
        { name: transformedNode.operationId, extname: '.ts', tag: transformedNode.tags[0] ?? 'default', path: transformedNode.path },
        { root, output, group },
      ),
    } as const

    function renderSchemaEntry({ schema, name, keysToOmit }: { schema: SchemaNode | null; name: string; keysToOmit?: Array<string> }) {
      if (!schema) return null

      const inferTypeName = inferred ? resolver.resolveTypeName(name) : undefined

      const imports = adapter.getImports(schema, (schemaName) => ({
        name: resolver.resolveSchemaName(schemaName),
        path: resolver.resolveFile({ name: schemaName, extname: '.ts' }, { root, output, group }).path,
      }))

      const schemaPrinter = mini
        ? printerZodMini({ guidType, wrapOutput, resolver, schemaName: name, keysToOmit, nodes: printer?.nodes })
        : printerZod({ coercion, guidType, wrapOutput, resolver, schemaName: name, keysToOmit, nodes: printer?.nodes })

      return (
        <>
          {mode === 'split' &&
            imports.map((imp) => <File.Import key={[name, imp.path, imp.name].join('-')} root={meta.file.path} path={imp.path} name={imp.name} />)}
          <Zod name={name} node={schema} printer={schemaPrinter} inferTypeName={inferTypeName} />
        </>
      )
    }

    const pathParams = params.filter((p) => p.in === 'path')
    const queryParams = params.filter((p) => p.in === 'query')
    const headerParams = params.filter((p) => p.in === 'header')

    const responseSchemas = transformedNode.responses.map((res) => {
      const responseName = resolver.resolveResponseStatusName(transformedNode, res.statusCode)
      return renderSchemaEntry({
        schema: {
          ...res.schema,
          description: res.description ?? res.schema.description,
        },
        name: responseName,
        keysToOmit: res.keysToOmit,
      })
    })

    const requestSchema = transformedNode.requestBody?.schema
      ? renderSchemaEntry({
          schema: {
            ...transformedNode.requestBody.schema,
            description: transformedNode.requestBody.description ?? transformedNode.requestBody.schema.description,
          },
          name: resolver.resolveDataName(transformedNode),
          keysToOmit: transformedNode.requestBody.keysToOmit,
        })
      : null

    const legacyParamTypes = [
      pathParams.length > 0
        ? renderSchemaEntry({
            schema: buildGroupedParamsSchema({ params: pathParams, optional: pathParams.every((p) => !p.required) }),
            name: resolver.resolvePathParamsName(transformedNode, pathParams[0]!),
          })
        : null,
      queryParams.length > 0
        ? renderSchemaEntry({
            schema: buildGroupedParamsSchema({ params: queryParams, optional: queryParams.every((p) => !p.required) }),
            name: resolver.resolveQueryParamsName(transformedNode, queryParams[0]!),
          })
        : null,
      headerParams.length > 0
        ? renderSchemaEntry({
            schema: buildGroupedParamsSchema({ params: headerParams, optional: headerParams.every((p) => !p.required) }),
            name: resolver.resolveHeaderParamsName(transformedNode, headerParams[0]!),
          })
        : null,
    ]

    const legacyResponsesSchema = renderSchemaEntry({
      schema: buildLegacyResponsesSchemaNode(transformedNode, { resolver }),
      name: resolver.resolveResponsesName(transformedNode),
    })

    const legacyResponseSchema = renderSchemaEntry({
      schema: buildLegacyResponseUnionSchemaNode(transformedNode, { resolver }),
      name: resolver.resolveResponseName(transformedNode),
    })

    return (
      <File
        baseName={meta.file.baseName}
        path={meta.file.path}
        meta={meta.file.meta}
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
  operations(nodes, options) {
    const { adapter, config, resolver, plugin, root } = this
    const { output, importPath, group, operations, paramsCasing } = options

    if (!operations) {
      return
    }
    const isZodImport = ZOD_NAMESPACE_IMPORTS.has(importPath as 'zod' | 'zod/mini')

    const meta = {
      file: resolver.resolveFile({ name: 'operations', extname: '.ts' }, { root, output, group }),
    } as const

    const transformedOperations = nodes.map((node) => {
      const transformedNode = plugin.transformer ? transform(node, plugin.transformer) : node

      const params = caseParams(transformedNode.parameters, paramsCasing)

      return {
        node: transformedNode,
        data: buildLegacySchemaNames(transformedNode, params, resolver),
      }
    })

    const imports = transformedOperations.flatMap(({ node, data }) => {
      const names = [data.request, ...Object.values(data.responses), ...Object.values(data.parameters)].filter(Boolean) as string[]
      const opFile = resolver.resolveFile({ name: node.operationId, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path }, { root, output, group })

      return names.map((name) => <File.Import key={[name, opFile.path].join('-')} name={[name]} root={meta.file.path} path={opFile.path} />)
    })

    return (
      <File
        baseName={meta.file.baseName}
        path={meta.file.path}
        meta={meta.file.meta}
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
