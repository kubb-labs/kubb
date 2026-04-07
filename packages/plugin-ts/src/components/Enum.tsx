import { camelCase, trimQuotes } from '@internals/utils'
import type { EnumSchemaNode } from '@kubb/ast/types'
import { safePrint } from '@kubb/parser-ts'
import { File } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'
import { ENUM_TYPES_WITH_KEY_SUFFIX, ENUM_TYPES_WITH_RUNTIME_VALUE, ENUM_TYPES_WITH_TYPE_ONLY } from '../constants.ts'
import * as factory from '../factory.ts'
import type { PluginTs, ResolverTs } from '../types.ts'

type Props = {
  node: EnumSchemaNode
  enumType: PluginTs['resolvedOptions']['enumType']
  enumTypeSuffix: PluginTs['resolvedOptions']['enumTypeSuffix']
  enumKeyCasing: PluginTs['resolvedOptions']['enumKeyCasing']
  resolver: ResolverTs
}

/**
 * Resolves the runtime identifier name and the TypeScript type name for an enum schema node.
 *
 * The raw `node.name` may be a YAML key such as `"enumNames.Type"` which is not a
 * valid TypeScript identifier. The resolver normalizes it; for inline enum
 * properties the adapter already emits a PascalCase+suffix name so resolution is typically a no-op.
 */
export function getEnumNames({
  node,
  enumType,
  enumTypeSuffix,
  resolver,
}: {
  node: EnumSchemaNode
  enumType: PluginTs['resolvedOptions']['enumType']
  enumTypeSuffix: PluginTs['resolvedOptions']['enumTypeSuffix']
  resolver: ResolverTs
}): {
  enumName: string
  typeName: string
} {
  const resolved = resolver.default(node.name!, 'type')
  const enumName = enumType === 'asPascalConst' ? resolved : camelCase(node.name!)
  const typeName = ENUM_TYPES_WITH_KEY_SUFFIX.has(enumType) ? resolver.resolveEnumKeyName(node, enumTypeSuffix) : resolved

  return { enumName, typeName }
}

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
export function Enum({ node, enumType, enumTypeSuffix, enumKeyCasing, resolver }: Props): KubbReactNode {
  const { enumName, typeName } = getEnumNames({ node, enumType, enumTypeSuffix, resolver })

  const [nameNode, typeNode] = factory.createEnumDeclaration({
    name: enumName,
    typeName,
    enums: (node.namedEnumValues?.map((v) => [trimQuotes(v.name.toString()), v.value]) ??
      node.enumValues?.filter((v): v is NonNullable<typeof v> => v !== null && v !== undefined).map((v) => [trimQuotes(v.toString()), v]) ??
      []) as Array<[string | number, string | number | boolean]>,
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
      <File.Source name={typeName} isIndexable isExportable={ENUM_TYPES_WITH_RUNTIME_VALUE.has(enumType)} isTypeOnly={ENUM_TYPES_WITH_TYPE_ONLY.has(enumType)}>
        {safePrint(typeNode)}
      </File.Source>
    </>
  )
}
