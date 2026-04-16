import { pascalCase } from '@internals/utils'
import type { Ast } from '@kubb/core'
import { ast, defineGenerator } from '@kubb/core'
import { File, jsxRenderer } from '@kubb/renderer-jsx'
import { Type } from '../components/Type.tsx'
import { ENUM_TYPES_WITH_KEY_SUFFIX } from '../constants.ts'
import { printerTs } from '../printers/printerTs.ts'
import { resolverTsLegacy } from '../resolvers/resolverTsLegacy.ts'
import type { PluginTs, ResolverTs } from '../types'

type BuildGroupedParamsSchemaOptions = {
  params: Array<Ast.ParameterNode>
  parentName?: string
}

function buildGroupedParamsSchema({ params, parentName }: BuildGroupedParamsSchemaOptions): Ast.SchemaNode {
  return ast.createSchema({
    type: 'object',
    properties: params.map((param) => {
      let schema = param.schema
      if (ast.narrowSchema(schema, 'enum') && !schema.name && parentName) {
        schema = { ...schema, name: pascalCase([parentName, param.name, 'enum'].join(' ')) }
      }
      return ast.createProperty({
        name: param.name,
        required: param.required,
        schema,
      })
    }),
  })
}

type BuildOperationSchemaOptions = {
  resolver: ResolverTs
}

function buildLegacyResponsesSchemaNode(node: Ast.OperationNode, { resolver }: BuildOperationSchemaOptions): Ast.SchemaNode | null {
  const isGet = node.method.toLowerCase() === 'get'
  const successResponses = node.responses.filter((res) => {
    const code = Number(res.statusCode)
    return !Number.isNaN(code) && code >= 200 && code < 300
  })
  const errorResponses = node.responses.filter((res) => res.statusCode === 'default' || Number(res.statusCode) >= 400)

  const responseSchema =
    successResponses.length > 0
      ? successResponses.length === 1
        ? ast.createSchema({ type: 'ref', name: resolver.resolveResponseStatusName(node, successResponses[0]!.statusCode) })
        : ast.createSchema({
            type: 'union',
            members: successResponses.map((res) => ast.createSchema({ type: 'ref', name: resolver.resolveResponseStatusName(node, res.statusCode) })),
          })
      : ast.createSchema({ type: 'any', primitive: undefined })

  const errorsSchema =
    errorResponses.length > 0
      ? errorResponses.length === 1
        ? ast.createSchema({ type: 'ref', name: resolver.resolveResponseStatusName(node, errorResponses[0]!.statusCode) })
        : ast.createSchema({
            type: 'union',
            members: errorResponses.map((res) => ast.createSchema({ type: 'ref', name: resolver.resolveResponseStatusName(node, res.statusCode) })),
          })
      : ast.createSchema({ type: 'any', primitive: undefined })

  const properties = [ast.createProperty({ name: 'Response', required: true, schema: responseSchema })]

  if (!isGet && node.requestBody?.schema) {
    properties.push(
      ast.createProperty({
        name: 'Request',
        required: true,
        schema: ast.createSchema({ type: 'ref', name: resolver.resolveDataName(node) }),
      }),
    )
  }

  const queryParam = node.parameters.find((p) => p.in === 'query')
  if (queryParam) {
    properties.push(
      ast.createProperty({
        name: 'QueryParams',
        required: true,
        schema: ast.createSchema({ type: 'ref', name: resolver.resolveQueryParamsName(node, queryParam) }),
      }),
    )
  }

  const pathParam = node.parameters.find((p) => p.in === 'path')
  if (pathParam) {
    properties.push(
      ast.createProperty({
        name: 'PathParams',
        required: true,
        schema: ast.createSchema({ type: 'ref', name: resolver.resolvePathParamsName(node, pathParam) }),
      }),
    )
  }

  const headerParam = node.parameters.find((p) => p.in === 'header')
  if (headerParam) {
    properties.push(
      ast.createProperty({
        name: 'HeaderParams',
        required: true,
        schema: ast.createSchema({ type: 'ref', name: resolver.resolveHeaderParamsName(node, headerParam) }),
      }),
    )
  }

  properties.push(ast.createProperty({ name: 'Errors', required: true, schema: errorsSchema }))

  return ast.createSchema({ type: 'object', properties })
}

function buildLegacyResponseUnionSchemaNode(node: Ast.OperationNode, { resolver }: BuildOperationSchemaOptions): Ast.SchemaNode {
  const successResponses = node.responses.filter((res) => {
    const code = Number(res.statusCode)
    return !Number.isNaN(code) && code >= 200 && code < 300
  })

  if (successResponses.length === 0) {
    return ast.createSchema({ type: 'any', primitive: undefined })
  }

  if (successResponses.length === 1) {
    return ast.createSchema({ type: 'ref', name: resolver.resolveResponseStatusName(node, successResponses[0]!.statusCode) })
  }

  return ast.createSchema({
    type: 'union',
    members: successResponses.map((res) => ast.createSchema({ type: 'ref', name: resolver.resolveResponseStatusName(node, res.statusCode) })),
  })
}

function nameUnnamedEnums(node: Ast.SchemaNode, parentName: string): Ast.SchemaNode {
  return ast.transform(node, {
    schema(n) {
      const enumNode = ast.narrowSchema(n, 'enum')
      if (enumNode && !enumNode.name) {
        return { ...enumNode, name: pascalCase([parentName, 'enum'].join(' ')) }
      }
      return undefined
    },
    property(p) {
      const enumNode = ast.narrowSchema(p.schema, 'enum')
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
  renderer: jsxRenderer,
  schema(node, ctx) {
    const { enumType, enumTypeSuffix, enumKeyCasing, syntaxType, optionalType, arrayType, output, group } = ctx.options
    const { adapter, config, resolver, root } = ctx

    if (!node.name) {
      return
    }

    const mode = ctx.getMode(output)

    const imports = adapter.getImports(node, (schemaName) => ({
      name: resolver.resolveTypeName(schemaName),
      path: resolver.resolveFile({ name: schemaName, extname: '.ts' }, { root, output, group }).path,
    }))

    const isEnumSchema = !!ast.narrowSchema(node, ast.schemaTypes.enum)

    const meta = {
      name: ENUM_TYPES_WITH_KEY_SUFFIX.has(enumType) && isEnumSchema ? resolver.resolveEnumKeyName(node, enumTypeSuffix) : resolver.resolveTypeName(node.name),
      file: resolver.resolveFile({ name: node.name, extname: '.ts' }, { root, output, group }),
    } as const

    const schemaPrinter = printerTs({
      optionalType,
      arrayType,
      enumType,
      enumTypeSuffix,
      name: meta.name,
      syntaxType,
      description: node.description,
      resolver,
    })

    return (
      <File
        baseName={meta.file.baseName}
        path={meta.file.path}
        meta={meta.file.meta}
        banner={resolver.resolveBanner(adapter.inputNode, { output, config })}
        footer={resolver.resolveFooter(adapter.inputNode, { output, config })}
      >
        {mode === 'split' &&
          imports.map((imp) => (
            <File.Import key={[node.name, imp.path, imp.isTypeOnly].join('-')} root={meta.file.path} path={imp.path} name={imp.name} isTypeOnly />
          ))}
        <Type
          name={meta.name}
          node={node}
          enumType={enumType}
          enumTypeSuffix={enumTypeSuffix}
          enumKeyCasing={enumKeyCasing}
          resolver={resolver}
          printer={schemaPrinter}
        />
      </File>
    )
  },
  operation(node, ctx) {
    const { enumType, enumTypeSuffix, enumKeyCasing, optionalType, arrayType, syntaxType, paramsCasing, group, output } = ctx.options
    const { adapter, config, resolver, root } = ctx

    const mode = ctx.getMode(output)
    const params = ast.caseParams(node.parameters, paramsCasing)

    const meta = {
      file: resolver.resolveFile({ name: node.operationId, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path }, { root, output, group }),
    } as const

    function renderSchemaType({
      schema,
      name,
      description,
      keysToOmit,
    }: {
      schema: Ast.SchemaNode | null
      name: string
      description?: string
      keysToOmit?: Array<string>
    }) {
      if (!schema) return null

      const imports = adapter.getImports(schema, (schemaName) => ({
        name: resolver.resolveTypeName(schemaName),
        path: resolver.resolveFile({ name: schemaName, extname: '.ts' }, { root, output, group }).path,
      }))

      const opPrinter = printerTs({
        optionalType,
        arrayType,
        enumType,
        enumTypeSuffix,
        name,
        syntaxType,
        description,
        keysToOmit,
        resolver,
      })

      return (
        <>
          {mode === 'split' &&
            imports.map((imp) => (
              <File.Import key={[name, imp.path, imp.isTypeOnly].join('-')} root={meta.file.path} path={imp.path} name={imp.name} isTypeOnly />
            ))}
          <Type
            name={name}
            node={schema}
            enumType={enumType}
            enumTypeSuffix={enumTypeSuffix}
            enumKeyCasing={enumKeyCasing}
            resolver={resolver}
            printer={opPrinter}
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
        schema: res.schema ? nameUnnamedEnums(res.schema, baseResponseName) : res.schema,
        name: responseName,
        description: res.description,
        keysToOmit: res.keysToOmit,
      })
    })

    const requestType = node.requestBody?.schema
      ? renderSchemaType({
          schema: nameUnnamedEnums(node.requestBody.schema, resolverTsLegacy.resolveDataName(node)),
          name: resolver.resolveDataName(node),
          description: node.requestBody.description ?? node.requestBody.schema.description,
          keysToOmit: node.requestBody.keysToOmit,
        })
      : null

    const legacyParamTypes = [
      pathParams.length > 0
        ? renderSchemaType({
            schema: buildGroupedParamsSchema({ params: pathParams, parentName: resolverTsLegacy.resolvePathParamsName(node, pathParams[0]!) }),
            name: resolver.resolvePathParamsName(node, pathParams[0]!),
          })
        : null,
      queryParams.length > 0
        ? renderSchemaType({
            schema: buildGroupedParamsSchema({ params: queryParams, parentName: resolverTsLegacy.resolveQueryParamsName(node, queryParams[0]!) }),
            name: resolver.resolveQueryParamsName(node, queryParams[0]!),
          })
        : null,
      headerParams.length > 0
        ? renderSchemaType({
            schema: buildGroupedParamsSchema({ params: headerParams, parentName: resolverTsLegacy.resolveHeaderParamsName(node, headerParams[0]!) }),
            name: resolver.resolveHeaderParamsName(node, headerParams[0]!),
          })
        : null,
    ]

    const legacyResponsesType = renderSchemaType({
      schema: buildLegacyResponsesSchemaNode(node, { resolver }),
      name: resolver.resolveResponsesName(node),
    })

    const legacyResponseType = renderSchemaType({
      schema: buildLegacyResponseUnionSchemaNode(node, { resolver }),
      name: resolver.resolveResponseName(node),
    })

    return (
      <File
        baseName={meta.file.baseName}
        path={meta.file.path}
        meta={meta.file.meta}
        banner={resolver.resolveBanner(adapter.inputNode, { output, config })}
        footer={resolver.resolveFooter(adapter.inputNode, { output, config })}
      >
        {legacyParamTypes}
        {responseTypes}
        {requestType}
        {legacyResponseType}
        {legacyResponsesType}
      </File>
    )
  },
})
