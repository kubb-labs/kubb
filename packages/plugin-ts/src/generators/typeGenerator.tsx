import type { PluginManager } from '@kubb/core'
import { useMode, usePluginManager } from '@kubb/core/hooks'
import transformers from '@kubb/core/transformers'
import { safePrint } from '@kubb/fabric-core/parsers/typescript'
import { isKeyword, type Operation, type OperationSchemas, type OperationSchema as OperationSchemaType, SchemaGenerator, schemaKeywords } from '@kubb/plugin-oas'
import { createReactGenerator } from '@kubb/plugin-oas/generators'
import { useOas, useOperationManager, useSchemaManager } from '@kubb/plugin-oas/hooks'
import { getBanner, getFooter } from '@kubb/plugin-oas/utils'
import { File } from '@kubb/react-fabric'
import ts from 'typescript'
import { Type } from '../components'
import * as factory from '../factory.ts'
import { pluginTsName } from '../plugin.ts'
import type { PluginTs } from '../types'

function printCombinedSchema({
  baseName,
  operation,
  schemas,
  pluginManager,
}: {
  baseName: string
  operation: Operation
  schemas: OperationSchemas
  pluginManager: PluginManager
}): string {
  const results: string[] = []

  // Generate DataRequest type
  const dataRequestProperties: ts.PropertySignature[] = []

  // Add body property (from request schema)
  if (schemas.request) {
    const identifier = pluginManager.resolveName({
      name: schemas.request.name,
      pluginKey: [pluginTsName],
      type: 'function',
    })
    dataRequestProperties.push(
      factory.createPropertySignature({
        name: 'body',
        questionToken: true,
        type: factory.createTypeReferenceNode(factory.createIdentifier(identifier), undefined),
      }),
    )
  }

  // Add pathParams property
  if (schemas.pathParams) {
    const identifier = pluginManager.resolveName({
      name: schemas.pathParams.name,
      pluginKey: [pluginTsName],
      type: 'function',
    })
    dataRequestProperties.push(
      factory.createPropertySignature({
        name: 'pathParams',
        type: factory.createTypeReferenceNode(factory.createIdentifier(identifier), undefined),
      }),
    )
  } else {
    dataRequestProperties.push(
      factory.createPropertySignature({
        name: 'pathParams',
        questionToken: true,
        type: factory.keywordTypeNodes.never,
      }),
    )
  }

  // Add queryParams property
  if (schemas.queryParams) {
    const identifier = pluginManager.resolveName({
      name: schemas.queryParams.name,
      pluginKey: [pluginTsName],
      type: 'function',
    })
    dataRequestProperties.push(
      factory.createPropertySignature({
        name: 'queryParams',
        questionToken: true,
        type: factory.createTypeReferenceNode(factory.createIdentifier(identifier), undefined),
      }),
    )
  } else {
    dataRequestProperties.push(
      factory.createPropertySignature({
        name: 'queryParams',
        questionToken: true,
        type: factory.keywordTypeNodes.never,
      }),
    )
  }

  // Add headerParams property
  if (schemas.headerParams) {
    const identifier = pluginManager.resolveName({
      name: schemas.headerParams.name,
      pluginKey: [pluginTsName],
      type: 'function',
    })
    dataRequestProperties.push(
      factory.createPropertySignature({
        name: 'headerParams',
        questionToken: true,
        type: factory.createTypeReferenceNode(factory.createIdentifier(identifier), undefined),
      }),
    )
  } else {
    dataRequestProperties.push(
      factory.createPropertySignature({
        name: 'headerParams',
        questionToken: true,
        type: factory.keywordTypeNodes.never,
      }),
    )
  }

  // Add url property with literal type
  dataRequestProperties.push(
    factory.createPropertySignature({
      name: 'url',
      type: factory.createLiteralTypeNode(factory.createStringLiteral(operation.path)),
    }),
  )

  const dataRequestNode = factory.createTypeAliasDeclaration({
    name: `${baseName}DataRequest`,
    type: factory.createTypeLiteralNode(dataRequestProperties),
    modifiers: [factory.modifiers.export],
  })

  results.push(safePrint(dataRequestNode))

  // Generate Responses type (mapping status codes to response types)
  if (schemas.responses && schemas.responses.length > 0) {
    const responsesProperties: ts.PropertySignature[] = schemas.responses.map((res) => {
      const identifier = pluginManager.resolveName({
        name: res.name,
        pluginKey: [pluginTsName],
        type: 'function',
      })

      return factory.createPropertySignature({
        name: res.statusCode?.toString() ?? 'default',
        type: factory.createTypeReferenceNode(factory.createIdentifier(identifier), undefined),
      })
    })

    const responsesNode = factory.createTypeAliasDeclaration({
      name: `${baseName}Responses`,
      type: factory.createTypeLiteralNode(responsesProperties),
      modifiers: [factory.modifiers.export],
    })

    results.push(safePrint(responsesNode))

    // Generate Response type (union via indexed access)
    const responseNode = factory.createTypeAliasDeclaration({
      name: `${baseName}Response`,
      type: factory.createIndexedAccessTypeNode(
        factory.createTypeReferenceNode(factory.createIdentifier(`${baseName}Responses`), undefined),
        factory.createTypeOperatorNode(
          ts.SyntaxKind.KeyOfKeyword,
          factory.createTypeReferenceNode(factory.createIdentifier(`${baseName}Responses`), undefined),
        ),
      ),
      modifiers: [factory.modifiers.export],
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
      options: { mapper, enumType, syntaxType, optionalType },
    } = plugin

    const mode = useMode()
    const pluginManager = usePluginManager()

    const oas = useOas()
    const { getSchemas, getFile, getName, getGroup } = useOperationManager(generator)
    const schemaManager = useSchemaManager()

    const file = getFile(operation)
    const schemas = getSchemas(operation)
    const type = getName(operation, { type: 'function', pluginKey: [pluginTsName] })
    const combinedSchemaName = operation.method === 'get' ? `${type}Query` : `${type}Mutation`
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

    const mapOperationSchema = ({ name, schema, description, keysToOmit, ...options }: OperationSchemaType) => {
      const tree = schemaGenerator.parse({ schema, name, parentName: null })
      const imports = schemaManager.getImports(tree)
      const group = options.operation ? getGroup(options.operation) : undefined

      const type = {
        name: schemaManager.getName(name, { type: 'type' }),
        typedName: schemaManager.getName(name, { type: 'type' }),
        file: schemaManager.getFile(options.operationName || name, { group }),
      }

      return (
        <>
          {mode === 'split' &&
            imports.map((imp) => (
              <File.Import key={[name, imp.name, imp.path, imp.isTypeOnly].join('-')} root={file.path} path={imp.path} name={imp.name} isTypeOnly />
            ))}
          <Type
            name={type.name}
            typedName={type.typedName}
            description={description}
            tree={tree}
            schema={schema}
            mapper={mapper}
            enumType={enumType}
            optionalType={optionalType}
            keysToOmit={keysToOmit}
            syntaxType={syntaxType}
          />
        </>
      )
    }

    return (
      <File
        baseName={file.baseName}
        path={file.path}
        meta={file.meta}
        banner={getBanner({ oas, output: plugin.options.output, config: pluginManager.config })}
        footer={getFooter({ oas, output: plugin.options.output })}
      >
        {operationSchemas.map(mapOperationSchema)}

        <File.Source name={`${type}DataRequest`} isExportable isIndexable isTypeOnly>
          {printCombinedSchema({ baseName: type, operation, schemas, pluginManager })}
        </File.Source>
      </File>
    )
  },
  Schema({ schema, plugin }) {
    const {
      options: { mapper, enumType, syntaxType, optionalType, output },
    } = plugin
    const mode = useMode()

    const oas = useOas()
    const pluginManager = usePluginManager()

    const { getName, getImports, getFile } = useSchemaManager()
    const imports = getImports(schema.tree)
    const schemaFromTree = schema.tree.find((item) => item.keyword === schemaKeywords.schema)

    let typedName = getName(schema.name, { type: 'type' })

    if (enumType === 'asConst' && schemaFromTree && isKeyword(schemaFromTree, schemaKeywords.enum)) {
      typedName = typedName += 'Key' //Suffix for avoiding collisions (https://github.com/kubb-labs/kubb/issues/1873)
    }

    const type = {
      name: getName(schema.name, { type: 'function' }),
      typedName,
      file: getFile(schema.name),
    }

    return (
      <File
        baseName={type.file.baseName}
        path={type.file.path}
        meta={type.file.meta}
        banner={getBanner({ oas, output, config: pluginManager.config })}
        footer={getFooter({ oas, output })}
      >
        {mode === 'split' &&
          imports.map((imp) => (
            <File.Import key={[schema.name, imp.path, imp.isTypeOnly].join('-')} root={type.file.path} path={imp.path} name={imp.name} isTypeOnly />
          ))}
        <Type
          name={type.name}
          typedName={type.typedName}
          description={schema.value.description}
          tree={schema.tree}
          schema={schema.value}
          mapper={mapper}
          enumType={enumType}
          optionalType={optionalType}
          syntaxType={syntaxType}
        />
      </File>
    )
  },
})
