import type { PluginManager } from '@kubb/core'
import transformers from '@kubb/core/transformers'
import { print } from '@kubb/parser-ts'
import * as factory from '@kubb/parser-ts/factory'
import { type OperationSchema as OperationSchemaType, type OperationSchemas, SchemaGenerator, createReactGenerator, schemaKeywords } from '@kubb/plugin-oas'
import { Oas } from '@kubb/plugin-oas/components'
import { useOas, useOperationManager, useSchemaManager } from '@kubb/plugin-oas/hooks'
import { pluginTsName } from '@kubb/plugin-ts'
import { File, useApp } from '@kubb/react'
import type ts from 'typescript'
import { Type } from '../components'
import type { PluginTs } from '../types'

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

  return print([namespaceNode])
}

export const typeGenerator = createReactGenerator<PluginTs>({
  name: 'typescript',
  Operation({ operation, options }) {
    const { mapper, enumType, optionalType } = options

    const { plugin, pluginManager, mode } = useApp<PluginTs>()
    const oas = useOas()
    const { getSchemas, getFile, getName, getGroup } = useOperationManager()
    const schemaManager = useSchemaManager()

    const file = getFile(operation)
    const schemas = getSchemas(operation)
    const type = getName(operation, { type: 'function', pluginKey: [pluginTsName] })
    const combinedSchemaName = operation.method === 'get' ? `${type}Query` : `${type}Mutation`
    const schemaGenerator = new SchemaGenerator(options, {
      oas,
      plugin,
      pluginManager,
      mode,
      override: options.override,
    })

    const operationSchemas = [schemas.pathParams, schemas.queryParams, schemas.headerParams, schemas.statusCodes, schemas.request, schemas.response]
      .flat()
      .filter(Boolean)

    const mapOperationSchema = ({ name, schema, description, keysToOmit, ...options }: OperationSchemaType, i: number) => {
      const tree = schemaGenerator.parse({ schema, name })
      const imports = schemaManager.getImports(tree)
      const group = options.operation ? getGroup(options.operation, plugin.options.group) : undefined

      const type = {
        name: schemaManager.getName(name, { type: 'type' }),
        typedName: schemaManager.getName(name, { type: 'type' }),
        file: schemaManager.getFile(options.operationName || name, { group }),
      }

      return (
        <Oas.Schema key={i} name={name} value={schema} tree={tree}>
          {mode === 'split' && imports.map((imp, index) => <File.Import key={index} root={file.path} path={imp.path} name={imp.name} isTypeOnly />)}
          <Type
            name={type.name}
            typedName={type.typedName}
            description={description}
            tree={tree}
            mapper={mapper}
            enumType={enumType}
            optionalType={optionalType}
            keysToOmit={keysToOmit}
          />
        </Oas.Schema>
      )
    }

    return (
      <File baseName={file.baseName} path={file.path} meta={file.meta} banner={plugin.options.output?.banner} footer={plugin.options.output?.footer}>
        {operationSchemas.map(mapOperationSchema)}

        <File.Source name={combinedSchemaName} isExportable isIndexable isTypeOnly>
          {printCombinedSchema({ name: combinedSchemaName, schemas, pluginManager })}
        </File.Source>
      </File>
    )
  },
  Schema({ schema, options }) {
    const { mapper, enumType, optionalType } = options
    const {
      mode,
      plugin: {
        options: { output },
      },
    } = useApp<PluginTs>()

    const { getName, getImports, getFile } = useSchemaManager()
    const imports = getImports(schema.tree)

    if (enumType === 'asPascalConst') {
      console.warn(`enumType '${enumType}' is deprecated`)
    }

    const type = {
      name: getName(schema.name, { type: 'function' }),
      typedName: getName(schema.name, { type: 'type' }),
      file: getFile(schema.name),
    }

    return (
      <File baseName={type.file.baseName} path={type.file.path} meta={type.file.meta} banner={output?.banner} footer={output?.footer}>
        {mode === 'split' && imports.map((imp, index) => <File.Import key={index} root={type.file.path} path={imp.path} name={imp.name} isTypeOnly />)}
        <Type
          name={type.name}
          typedName={type.typedName}
          description={schema.value.description}
          tree={schema.tree}
          mapper={mapper}
          enumType={enumType}
          optionalType={optionalType}
        />
      </File>
    )
  },
})
