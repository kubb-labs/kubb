import { camelCase, pascalCase, trimQuotes } from '@internals/utils'
import type { EnumSchemaNode } from '@kubb/ast/types'
import { safePrint } from '@kubb/fabric-core/parsers/typescript'
import { File } from '@kubb/react-fabric'
import type { FabricReactNode } from '@kubb/react-fabric/types'
import * as factory from '../../factory.ts'
import type { PluginTs } from '../../types.ts'

type Props = {
  enumSchemaNode: EnumSchemaNode
  enumType: PluginTs['resolvedOptions']['enumType']
  enumKeyCasing: PluginTs['resolvedOptions']['enumKeyCasing']
}

/**
 * Resolves the runtime identifier name and the TypeScript type name for an enum schema node.
 *
 * The raw `enumSchemaNode.name` may be a YAML key such as `"enumNames.Type"` which is not a
 * valid TypeScript identifier. `pascalCase` normalizes it unconditionally; for inline enum
 * properties the adapter already emits a PascalCase+suffix name so `pascalCase` is a no-op.
 */
export function getEnumNames(enumSchemaNode: EnumSchemaNode, enumType: PluginTs['resolvedOptions']['enumType']): { enumName: string; typeName: string } {
  const resolved = pascalCase(enumSchemaNode.name!)
  const enumName = enumType === 'asPascalConst' ? resolved : camelCase(enumSchemaNode.name!)
  const typeName = ['asConst', 'asPascalConst'].includes(enumType) ? `${resolved}Key` : resolved

  return { enumName, typeName }
}

const ENUM_TYPES_WITH_RUNTIME_VALUE: Array<PluginTs['resolvedOptions']['enumType'] | undefined> = [
  'enum',
  'asConst',
  'asPascalConst',
  'constEnum',
  'literal',
  undefined,
]
const ENUM_TYPES_WITH_TYPE_ONLY: Array<PluginTs['resolvedOptions']['enumType'] | undefined> = ['asConst', 'asPascalConst', 'literal', undefined]

/**
 * Renders the enum declaration(s) for a single named `EnumSchemaNode`.
 *
 * Depending on `enumType` this may emit:
 * - A runtime object (`asConst` / `asPascalConst`) plus a `typeof` type alias
 * - A `const enum` or plain `enum` declaration (`constEnum` / `enum`)
 * - A union literal type alias (`literal`)
 *
 * The emitted `File.Source` nodes carry the resolved names so that the barrel
 * index picks up the correct export identifiers.
 */
export function Enum({ enumSchemaNode, enumType, enumKeyCasing }: Props): FabricReactNode {
  const { enumName, typeName } = getEnumNames(enumSchemaNode, enumType)

  const [nameNode, typeNode] = factory.createEnumDeclaration({
    name: enumName,
    typeName,
    enums: (enumSchemaNode.namedEnumValues?.map((v) => [trimQuotes(v.name.toString()), v.value]) ??
      enumSchemaNode.enumValues?.filter((v): v is NonNullable<typeof v> => v !== null && v !== undefined).map((v) => [trimQuotes(v.toString()), v]) ??
      []) as unknown as Array<[string, string]>,
    type: enumType,
    enumKeyCasing,
  })

  return (
    <>
      {nameNode && (
        <File.Source name={enumName} isExportable isIndexable isTypeOnly={false}>
          {safePrint(nameNode)}
        </File.Source>
      )}
      <File.Source
        name={typeName}
        isIndexable
        isExportable={ENUM_TYPES_WITH_RUNTIME_VALUE.includes(enumType)}
        isTypeOnly={ENUM_TYPES_WITH_TYPE_ONLY.includes(enumType)}
      >
        {safePrint(typeNode)}
      </File.Source>
    </>
  )
}
