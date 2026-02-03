import type { PluginManager } from '@kubb/core'
import { useMode, usePluginManager } from '@kubb/core/hooks'
import transformers from '@kubb/core/transformers'
import { safePrint } from '@kubb/fabric-core/parsers/typescript'
import type { Operation } from '@kubb/oas'
import { isKeyword, type OperationSchemas, type OperationSchema as OperationSchemaType, SchemaGenerator, schemaKeywords } from '@kubb/plugin-oas'
import { createReactGenerator } from '@kubb/plugin-oas/generators'
import { useOas, useOperationManager, useResolve } from '@kubb/plugin-oas/hooks'
import type { Resolution } from '@kubb/plugin-oas/resolvers'
import { getBanner, getFooter, getImports } from '@kubb/plugin-oas/utils'
import { File } from '@kubb/react-fabric'
import ts from 'typescript'
import { Type } from '../components'
import * as factory from '../factory.ts'
import { createUrlTemplateType, getUnknownType, keywordTypeNodes } from '../factory.ts'
import { pluginTsName } from '../plugin.ts'
import type { PluginTs } from '../types'

/**
 * @deprecated this will be removed in v5, use printRequestSchema and printResponseSchema instead
 */
function printCombinedSchema({ name, schemas, pluginManager }: { name: string; schemas: OperationSchemas; pluginManager: PluginManager }): string {
  const properties: Record<string, ts.TypeNode> = {}

  if (schemas.response) {
    properties['response'] = factory.createUnionDeclaration({
      nodes: schemas.responses.map((res) => {
        const identifier = pluginManager.resolveName({
          name: res.name,
          pluginKey: [pluginTsName],
          type: 'function',
        })

        return factory.createTypeReferenceNode(factory.createIdentifier(identifier), undefined)
      }),
    })!
  }

  if (schemas.request) {
    const identifier = pluginManager.resolveName({
      name: schemas.request.name,
      pluginKey: [pluginTsName],
      type: 'function',
    })
    properties['request'] = factory.createTypeReferenceNode(factory.createIdentifier(identifier), undefined)
  }

  if (schemas.pathParams) {
    const identifier = pluginManager.resolveName({
      name: schemas.pathParams.name,
      pluginKey: [pluginTsName],
      type: 'function',
    })
    properties['pathParams'] = factory.createTypeReferenceNode(factory.createIdentifier(identifier), undefined)
  }

  if (schemas.queryParams) {
    const identifier = pluginManager.resolveName({
      name: schemas.queryParams.name,
      pluginKey: [pluginTsName],
      type: 'function',
    })
    properties['queryParams'] = factory.createTypeReferenceNode(factory.createIdentifier(identifier), undefined)
  }

  if (schemas.headerParams) {
    const identifier = pluginManager.resolveName({
      name: schemas.headerParams.name,
      pluginKey: [pluginTsName],
      type: 'function',
    })
    properties['headerParams'] = factory.createTypeReferenceNode(factory.createIdentifier(identifier), undefined)
  }

  if (schemas.errors) {
    properties['errors'] = factory.createUnionDeclaration({
      nodes: schemas.errors.map((error) => {
        const identifier = pluginManager.resolveName({
          name: error.name,
          pluginKey: [pluginTsName],
          type: 'function',
        })

        return factory.createTypeReferenceNode(factory.createIdentifier(identifier), undefined)
      }),
    })!
  }

  const namespaceNode = factory.createTypeAliasDeclaration({
    name,
    type: factory.createTypeLiteralNode(
      Object.keys(properties)
        .map((key) => {
          const type = properties[key]
          if (!type) {
            return undefined
          }

          return factory.createPropertySignature({
            name: transformers.pascalCase(key),
            type,
          })
        })
        .filter(Boolean),
    ),
    modifiers: [factory.modifiers.export],
  })

  return safePrint(namespaceNode)
}

function printRequestSchema({ resolution, operation, schemas }: { resolution: Resolution<PluginTs>; operation: Operation; schemas: OperationSchemas }): string {
  const results: string[] = []

  // Generate DataRequest type
  const dataRequestProperties: ts.PropertySignature[] = []

  if (schemas.request) {
    dataRequestProperties.push(
      factory.createPropertySignature({
        name: 'data',
        questionToken: true,
        type: factory.createTypeReferenceNode(factory.createIdentifier(resolution.outputs.request.name), undefined),
      }),
    )
  } else {
    dataRequestProperties.push(
      factory.createPropertySignature({
        name: 'data',
        questionToken: true,
        type: keywordTypeNodes.never,
      }),
    )
  }

  // Add pathParams property
  if (schemas.pathParams) {
    dataRequestProperties.push(
      factory.createPropertySignature({
        name: 'pathParams',
        type: factory.createTypeReferenceNode(factory.createIdentifier(resolution.outputs.pathParams.name), undefined),
      }),
    )
  } else {
    dataRequestProperties.push(
      factory.createPropertySignature({
        name: 'pathParams',
        questionToken: true,
        type: keywordTypeNodes.never,
      }),
    )
  }

  // Add queryParams property
  if (schemas.queryParams) {
    dataRequestProperties.push(
      factory.createPropertySignature({
        name: 'queryParams',
        questionToken: true,
        type: factory.createTypeReferenceNode(factory.createIdentifier(resolution.outputs.queryParams.name), undefined),
      }),
    )
  } else {
    dataRequestProperties.push(
      factory.createPropertySignature({
        name: 'queryParams',
        questionToken: true,
        type: keywordTypeNodes.never,
      }),
    )
  }

  // Add headerParams property
  if (schemas.headerParams) {
    dataRequestProperties.push(
      factory.createPropertySignature({
        name: 'headerParams',
        questionToken: true,
        type: factory.createTypeReferenceNode(factory.createIdentifier(resolution.outputs.headerParams.name), undefined),
      }),
    )
  } else {
    dataRequestProperties.push(
      factory.createPropertySignature({
        name: 'headerParams',
        questionToken: true,
        type: keywordTypeNodes.never,
      }),
    )
  }

  // Add url property with template literal type
  dataRequestProperties.push(
    factory.createPropertySignature({
      name: 'url',
      type: createUrlTemplateType(operation.path),
    }),
  )

  const dataRequestNode = factory.createTypeAliasDeclaration({
    name: resolution.outputs.request.name,
    type: factory.createTypeLiteralNode(dataRequestProperties),
    modifiers: [factory.modifiers.export],
  })

  results.push(safePrint(dataRequestNode))

  return results.join('\n\n')
}

function printResponseSchema({
  resolution,
  schemas,
  unknownType,
}: {
  resolution: Resolution<PluginTs>
  schemas: OperationSchemas
  unknownType: PluginTs['resolvedOptions']['unknownType']
}): string {
  const results: string[] = []

  // Generate Responses type (mapping status codes to response types)
  if (schemas.responses && schemas.responses.length > 0) {
    const responsesProperties: ts.PropertySignature[] = schemas.responses.map((res) => {
      return factory.createPropertySignature({
        name: res.statusCode?.toString() ?? 'default',
        type: factory.createTypeReferenceNode(factory.createIdentifier(resolution.outputs.response.name), undefined),
      })
    })

    const responsesNode = factory.createTypeAliasDeclaration({
      name: resolution.outputs.responses.name,
      type: factory.createTypeLiteralNode(responsesProperties),
      modifiers: [factory.modifiers.export],
    })

    results.push(safePrint(responsesNode))

    // Generate Response type (union via indexed access)
    const responseNode = factory.createTypeAliasDeclaration({
      name: resolution.outputs.responseData.name,
      type: factory.createIndexedAccessTypeNode(
        factory.createTypeReferenceNode(factory.createIdentifier(resolution.outputs.responses.name), undefined),
        factory.createTypeOperatorNode(
          ts.SyntaxKind.KeyOfKeyword,
          factory.createTypeReferenceNode(factory.createIdentifier(resolution.outputs.responses.name), undefined),
        ),
      ),
      modifiers: [factory.modifiers.export],
    })

    results.push(safePrint(responseNode))
  } else {
    const responseNode = factory.createTypeAliasDeclaration({
      name: resolution.outputs.responseData.name,
      modifiers: [factory.modifiers.export],
      type: getUnknownType(unknownType),
    })

    results.push(safePrint(responseNode))
  }

  return results.join('\n\n')
}

export const typeGenerator = createReactGenerator<PluginTs>({
  name: 'typescript',
  Operation({ operation, generator, plugin }) {
    const {
      options,
      options: { mapper, enumType, enumKeyCasing, syntaxType, optionalType, arrayType, unknownType },
    } = plugin

    const mode = useMode()
    const oas = useOas()
    const pluginManager = usePluginManager()
    const resolution = useResolve<PluginTs>({ operation })

    if (!resolution) {
      return null
    }

    const { getSchemas, getFile } = useOperationManager(generator)

    const file = getFile(operation)
    const schemas = getSchemas(operation)
    const schemaGenerator = new SchemaGenerator(options, {
      fabric: generator.context.fabric,
      oas,
      events: generator.context.events,
      plugin,
      pluginManager,
      mode,
      override: options.override,
    })

    const operationSchemas = [schemas.pathParams, schemas.queryParams, schemas.headerParams, schemas.statusCodes, schemas.request, schemas.response]
      .flat()
      .filter(Boolean)

    const mapOperationSchema = ({ name, schema, description, keysToOmit }: OperationSchemaType) => {
      const tree = schemaGenerator.parse({ schema, name, parentName: null })

      const resolution = useResolve<PluginTs>({
        schema: {
          name,
          value: schema,
        },
      })

      if (!resolution) {
        return null
      }

      const imports = getImports(tree)

      let typedName = resolution.outputs.type.name
      const schemaFromTree = tree.find((item) => item.keyword === schemaKeywords.schema)

      if (enumType === 'asConst' && schemaFromTree && isKeyword(schemaFromTree, schemaKeywords.enum)) {
        typedName = resolution.outputs.enum.name //Suffix for avoiding collisions (https://github.com/kubb-labs/kubb/issues/1873)
      }

      return (
        <>
          {mode === 'split' &&
            imports.map((imp) => (
              <File.Import key={[name, imp.name, imp.path, imp.isTypeOnly].join('-')} root={file.path} path={imp.path} name={imp.name} isTypeOnly />
            ))}
          <Type
            name={resolution.outputs.type.name}
            typedName={typedName}
            description={description}
            tree={tree}
            schema={schema}
            mapper={mapper}
            enumType={enumType}
            enumKeyCasing={enumKeyCasing}
            optionalType={optionalType}
            arrayType={arrayType}
            keysToOmit={keysToOmit}
            syntaxType={syntaxType}
          />
        </>
      )
    }

    const combinedSchemaName = operation.method === 'get' ? resolution.outputs.query.name : resolution.outputs.mutation.name

    return (
      <File
        baseName={file.baseName}
        path={file.path}
        meta={file.meta}
        banner={getBanner({
          oas,
          output: plugin.options.output,
          config: pluginManager.config,
        })}
        footer={getFooter({ oas, output: plugin.options.output })}
      >
        {operationSchemas.map(mapOperationSchema)}

        {generator.context.UNSTABLE_NAMING ? (
          <>
            <File.Source name={resolution.outputs.request.name} isExportable isIndexable isTypeOnly>
              {printRequestSchema({
                resolution,
                operation,
                schemas,
              })}
            </File.Source>
            <File.Source name={resolution.outputs.response.name} isExportable isIndexable isTypeOnly>
              {printResponseSchema({
                resolution,
                schemas,
                unknownType,
              })}
            </File.Source>
          </>
        ) : (
          <File.Source name={combinedSchemaName} isExportable isIndexable isTypeOnly>
            {printCombinedSchema({
              name: combinedSchemaName,
              schemas,
              pluginManager,
            })}
          </File.Source>
        )}
      </File>
    )
  },
  Schema({ schema, plugin, config }) {
    const {
      options: { mapper, enumType, enumKeyCasing, syntaxType, optionalType, arrayType, output },
    } = plugin
    const mode = useMode()
    const oas = useOas()
    const resolution = useResolve<PluginTs>({ schema })

    if (!resolution) {
      return null
    }

    const imports = getImports(schema.tree)
    const schemaFromTree = schema.tree.find((item) => item.keyword === schemaKeywords.schema)

    let typedName = resolution.outputs.type.name

    if (enumType === 'asConst' && schemaFromTree && isKeyword(schemaFromTree, schemaKeywords.enum)) {
      typedName = resolution.outputs.enum.name //Suffix for avoiding collisions (https://github.com/kubb-labs/kubb/issues/1873)
    }

    return (
      <File
        baseName={resolution.file.baseName}
        path={resolution.file.path}
        meta={{
          pluginKey: plugin.key,
        }}
        banner={getBanner({ oas, output, config })}
        footer={getFooter({ oas, output })}
      >
        {mode === 'split' &&
          imports.map((imp) => (
            <File.Import key={[schema.name, imp.path, imp.isTypeOnly].join('-')} root={resolution.file.path} path={imp.path} name={imp.name} isTypeOnly />
          ))}
        <Type
          name={resolution.outputs.type.name}
          typedName={typedName}
          description={schema.value.description}
          tree={schema.tree}
          schema={schema.value}
          mapper={mapper}
          enumType={enumType}
          enumKeyCasing={enumKeyCasing}
          optionalType={optionalType}
          arrayType={arrayType}
          syntaxType={syntaxType}
        />
      </File>
    )
  },
})
