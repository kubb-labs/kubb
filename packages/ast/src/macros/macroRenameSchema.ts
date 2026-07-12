import { defineMacro } from '../defineMacro.ts'
import { narrowSchema } from '../guards.ts'
import { resolveRefName } from '../utils/refs.ts'

type Props = {
  from: string
  to: string
}

/**
 * Builds a macro that renames a schema consistently: the declaration (`name`) and every ref
 * pointing at it (`targetName`) change together, so imports and printed references stay in
 * sync. Renaming only one side by hand produces imports for files that are never generated.
 *
 * @example
 * `const macro = macroRenameSchema({ from: 'Order', to: 'StoreOrder' })`
 */
export function macroRenameSchema({ from, to }: Props) {
  return defineMacro({
    name: 'rename-schema',
    schema(node) {
      const refNode = narrowSchema(node, 'ref')

      if (!refNode) {
        return node.name === from ? { ...node, name: to } : undefined
      }

      const renamesDeclaration = refNode.name === from
      const renamesTarget = resolveRefName(refNode) === from
      if (!renamesDeclaration && !renamesTarget) return undefined

      return {
        ...refNode,
        ...(renamesDeclaration ? { name: to } : {}),
        ...(renamesTarget ? { targetName: to } : {}),
      }
    },
  })
}
