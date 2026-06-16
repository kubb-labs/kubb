import { defineMacro } from '../defineMacro.ts'
import { narrowSchema } from '../guards.ts'
import { enumPropName } from '../utils/refs.ts'

type Props = {
  parentName: string | null | undefined
  propName: string
  enumSuffix: string
}

/**
 * Builds a macro that names an inline enum schema from its parent and property name. Boolean enums
 * are left anonymous. Non-enum nodes are returned unchanged.
 *
 * @example
 * ```ts
 * const macro = macroEnumName({ parentName: 'Pet', propName: 'status', enumSuffix: 'enum' })
 * const named = applyMacros(propSchema, [macro], { depth: 'shallow' })
 * ```
 */
export function macroEnumName({ parentName, propName, enumSuffix }: Props) {
  return defineMacro({
    name: 'enum-name',
    schema(node) {
      const enumNode = narrowSchema(node, 'enum')

      if (enumNode?.primitive === 'boolean') return { ...node, name: null }
      if (enumNode) return { ...node, name: enumPropName(parentName, propName, enumSuffix) }

      return undefined
    },
  })
}
