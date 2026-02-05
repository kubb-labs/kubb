import transformers from '@kubb/core/transformers'
import { safePrint } from '@kubb/fabric-core/parsers/typescript'
import type { SchemaObject } from '@kubb/oas'
import { isKeyword, type Schema, SchemaGenerator, schemaKeywords } from '@kubb/plugin-oas'
import { File } from '@kubb/react-fabric'
import type { FabricReactNode } from '@kubb/react-fabric/types'
import type ts from 'typescript'
import * as factory from '../factory.ts'
import { parse, typeKeywordMapper } from '../parser.ts'
import type { PluginTs } from '../types.ts'

type Props = {
  name: string
  typedName: string
  schema: SchemaObject
  tree: Array<Schema>
  optionalType: PluginTs['resolvedOptions']['optionalType']
  arrayType: PluginTs['resolvedOptions']['arrayType']
  enumType: PluginTs['resolvedOptions']['enumType']
  enumKeyCasing: PluginTs['resolvedOptions']['enumKeyCasing']
  mapper: PluginTs['resolvedOptions']['mapper']
  syntaxType: PluginTs['resolvedOptions']['syntaxType']
  description?: string
  keysToOmit?: string[]
}

export function Type({
  name,
  typedName,
  tree,
  keysToOmit,
  schema,
  optionalType,
  arrayType,
  syntaxType,
  enumType,
  enumKeyCasing,
  mapper,
  description,
}: Props): FabricReactNode {
  const typeNodes: ts.Node[] = []

  if (!tree.length) {
    return ''
  }

  const schemaFromTree = tree.find((item) => item.keyword === schemaKeywords.schema)
  const enumSchemas = SchemaGenerator.deepSearch(tree, schemaKeywords.enum)

  let type =
    (tree
      .map((current, _index, siblings) =>
        parse(
          { name, schema, parent: undefined, current, siblings },
          {
            optionalType,
            arrayType,
            enumType,
            mapper,
          },
        ),
      )
      .filter(Boolean)
      .at(0) as ts.TypeNode) || typeKeywordMapper.undefined()

  // Add a "Key" suffix to avoid collisions where necessary
  if (enumType === 'asConst' && enumSchemas.length > 0) {
    const isDirectEnum = schema.type === 'array' && schema.items !== undefined
    const isEnumOnly = 'enum' in schema && schema.enum

    if (isDirectEnum || isEnumOnly) {
      const enumSchema = enumSchemas[0]!
      const typeNameWithKey = `${enumSchema.args.typeName}Key`

      type = factory.createTypeReferenceNode(typeNameWithKey)

      if (schema.type === 'array') {
        if (arrayType === 'generic') {
          type = factory.createTypeReferenceNode(factory.createIdentifier('Array'), [type])
        } else {
          type = factory.createArrayTypeNode(type)
        }
      }
    }
  }

  if (schemaFromTree && isKeyword(schemaFromTree, schemaKeywords.schema)) {
    const isNullish = tree.some((item) => item.keyword === schemaKeywords.nullish)
    const isNullable = tree.some((item) => item.keyword === schemaKeywords.nullable)
    const isOptional = tree.some((item) => item.keyword === schemaKeywords.optional)

    if (isNullable) {
      type = factory.createUnionDeclaration({
        nodes: [type, factory.keywordTypeNodes.null],
      }) as ts.TypeNode
    }

    if (isNullish && ['undefined', 'questionTokenAndUndefined'].includes(optionalType as string)) {
      type = factory.createUnionDeclaration({
        nodes: [type, factory.keywordTypeNodes.undefined],
      }) as ts.TypeNode
    }

    if (isOptional && ['undefined', 'questionTokenAndUndefined'].includes(optionalType as string)) {
      type = factory.createUnionDeclaration({
        nodes: [type, factory.keywordTypeNodes.undefined],
      }) as ts.TypeNode
    }
  }

  const useTypeGeneration = syntaxType === 'type' || [factory.syntaxKind.union].includes(type.kind as typeof factory.syntaxKind.union) || !!keysToOmit?.length

  typeNodes.push(
    factory.createTypeDeclaration({
      name,
      isExportable: true,
      type: keysToOmit?.length
        ? factory.createOmitDeclaration({
            keys: keysToOmit,
            type,
            nonNullable: true,
          })
        : type,
      syntax: useTypeGeneration ? 'type' : 'interface',
      comments: [
        description ? `@description ${transformers.jsStringEscape(description)}` : undefined,
        schema.deprecated ? '@deprecated' : undefined,
        schema.minLength ? `@minLength ${schema.minLength}` : undefined,
        schema.maxLength ? `@maxLength ${schema.maxLength}` : undefined,
        schema.pattern ? `@pattern ${schema.pattern}` : undefined,
        schema.default ? `@default ${schema.default}` : undefined,
        schema.example ? `@example ${schema.example}` : undefined,
      ],
    }),
  )

  const enums = [...new Set(enumSchemas)].map((enumSchema) => {
    const name = enumType === 'asPascalConst' ? transformers.pascalCase(enumSchema.args.name) : transformers.camelCase(enumSchema.args.name)
    const typeName = enumType === 'asConst' ? `${enumSchema.args.typeName}Key` : enumSchema.args.typeName

    const [nameNode, typeNode] = factory.createEnumDeclaration({
      name,
      typeName,
      enums: enumSchema.args.items
        .map((item) => (item.value === undefined ? undefined : [transformers.trimQuotes(item.name?.toString()), item.value]))
        .filter(Boolean) as unknown as Array<[string, string]>,
      type: enumType,
      enumKeyCasing,
    })

    return {
      nameNode,
      typeNode,
      name,
      typeName,
    }
  })

  // Skip enum exports when using inlineLiteral
  const shouldExportEnums = enumType !== 'inlineLiteral'
  const shouldExportType = enumType === 'inlineLiteral' || enums.every((item) => item.typeName !== name)

  return (
    <>
      {shouldExportEnums &&
        enums.map(({ name, nameNode, typeName, typeNode }) => (
          <>
            {nameNode && (
              <File.Source name={name} isExportable isIndexable>
                {safePrint(nameNode)}
              </File.Source>
            )}
            {
              <File.Source
                name={typeName}
                isIndexable
                isExportable={['enum', 'asConst', 'asPascalConst', 'constEnum', 'literal', undefined].includes(enumType)}
                isTypeOnly={['asConst', 'asPascalConst', 'literal', undefined].includes(enumType)}
              >
                {safePrint(typeNode)}
              </File.Source>
            }
          </>
        ))}
      {shouldExportType && (
        <File.Source name={typedName} isTypeOnly isExportable isIndexable>
          {safePrint(...typeNodes)}
        </File.Source>
      )}
    </>
  )
}
