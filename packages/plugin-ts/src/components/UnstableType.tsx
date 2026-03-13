import type { SchemaNode } from '@internals/ast'
import { collect, type EnumSchemaNode } from '@internals/ast'
import { camelCase, jsStringEscape, pascalCase, trimQuotes } from '@internals/utils'
import { safePrint } from '@kubb/fabric-core/parsers/typescript'
import { File } from '@kubb/react-fabric'
import type { FabricReactNode } from '@kubb/react-fabric/types'
import type ts from 'typescript'
import * as factory from '../factory.ts'
import { parseSchemaNode } from '../parserSchemaNode.ts'
import type { PluginTs } from '../types.ts'

type Props = {
  name: string
  typedName: string
  schemaNode: SchemaNode
  optionalType: PluginTs['resolvedOptions']['optionalType']
  arrayType: PluginTs['resolvedOptions']['arrayType']
  enumType: PluginTs['resolvedOptions']['enumType']
  enumKeyCasing: PluginTs['resolvedOptions']['enumKeyCasing']
  mapper: PluginTs['resolvedOptions']['mapper']
  syntaxType: PluginTs['resolvedOptions']['syntaxType']
  description?: string
  keysToOmit?: string[]
  UNSTABLE_SCHEMA?: true
}

export function UnstableType({
  name,
  typedName,
  schemaNode,
  keysToOmit,
  optionalType,
  arrayType,
  syntaxType,
  enumType,
  enumKeyCasing,
  mapper,
  UNSTABLE_SCHEMA,
  ...rest
}: Props): FabricReactNode {
  const typeNodes: ts.Node[] = []

  const description = rest.description || schemaNode?.description
  const enumSchemaNodes = collect<EnumSchemaNode>(schemaNode, {
    schema(n): EnumSchemaNode | undefined {
      if (n.type === 'enum' && n.name) return n as EnumSchemaNode
    },
  })

  let type = parseSchemaNode(schemaNode, { optionalType, arrayType, enumType })!

  // Add a "Key" suffix to avoid collisions where necessary
  if (['asConst', 'asPascalConst'].includes(enumType) && enumSchemaNodes.length > 0) {
    const isDirectEnum = schemaNode.type === 'array' && schemaNode.items !== undefined
    const isEnumOnly = 'enum' in schemaNode && schemaNode.enum

    if (isDirectEnum || isEnumOnly) {
      const enumSchemaNode = enumSchemaNodes[0]!
      const typeNameWithKey = `${enumSchemaNode.name!}Key`

      type = factory.createTypeReferenceNode(typeNameWithKey)

      if (isDirectEnum) {
        if (arrayType === 'generic') {
          type = factory.createTypeReferenceNode(factory.createIdentifier('Array'), [type])
        } else {
          type = factory.createArrayTypeNode(type)
        }
      }
    }
  }

  if (schemaNode) {
    if (schemaNode.nullable) {
      type = factory.createUnionDeclaration({
        nodes: [type, factory.keywordTypeNodes.null],
      }) as ts.TypeNode
    }

    if (schemaNode.nullish && ['undefined', 'questionTokenAndUndefined'].includes(optionalType as string)) {
      type = factory.createUnionDeclaration({
        nodes: [type, factory.keywordTypeNodes.undefined],
      }) as ts.TypeNode
    }

    if (schemaNode.optional && ['undefined', 'questionTokenAndUndefined'].includes(optionalType as string)) {
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
        schemaNode?.title ? `${jsStringEscape(schemaNode.title)}` : undefined,
        description ? `@description ${jsStringEscape(description)}` : undefined,
        schemaNode?.deprecated ? '@deprecated' : undefined,
        schemaNode && 'min' in schemaNode && schemaNode.min !== undefined ? `@minLength ${schemaNode.min}` : undefined,
        schemaNode && 'max' in schemaNode && schemaNode.max !== undefined ? `@maxLength ${schemaNode.max}` : undefined,
        schemaNode && 'pattern' in schemaNode && schemaNode.pattern ? `@pattern ${schemaNode.pattern}` : undefined,
        schemaNode?.default ? `@default ${schemaNode.default}` : undefined,
        schemaNode?.example ? `@example ${schemaNode.example}` : undefined,
      ],
    }),
  )

  const enums = [...new Map(enumSchemaNodes.map((n) => [n.name, n])).values()].map((enumSchemaNode) => {
    const name = enumType === 'asPascalConst' ? pascalCase(enumSchemaNode.name!) : camelCase(enumSchemaNode.name!)
    const typeName = ['asConst', 'asPascalConst'].includes(enumType) ? `${enumSchemaNode.name!}Key` : enumSchemaNode.name!

    const [nameNode, typeNode] = factory.createEnumDeclaration({
      name,
      typeName,
      enums: (enumSchemaNode.namedEnumValues?.map((v) => [trimQuotes(v.name.toString()), v.value]) ??
        enumSchemaNode.enumValues?.filter((v): v is NonNullable<typeof v> => v !== null && v !== undefined).map((v) => [trimQuotes(v.toString()), v]) ??
        []) as unknown as Array<[string, string]>,
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
              <File.Source name={name} isExportable isIndexable isTypeOnly={false}>
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
