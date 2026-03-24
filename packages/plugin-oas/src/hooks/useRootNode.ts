import type { RootNode } from '@kubb/ast/types'
import { useFabric } from '@kubb/react-fabric'

/**
 * Returns the universal `@kubb/ast` `RootNode` produced by the configured adapter.
 *
 * Use this hook inside generator components when you want to consume the
 * format-agnostic AST directly instead of going through `useOas()`.
 *
 * Returns `undefined` when no adapter was configured (legacy OAS-only mode).
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const rootNode = useRootNode()
 *   if (!rootNode) return null
 *   return <>{rootNode.schemas.map(s => <Schema key={s.name} node={s} />)}</>
 * }
 * ```
 */
export function useRootNode(): RootNode | undefined {
  const { meta } = useFabric<{ pluginManager?: { rootNode?: RootNode } }>()

  return meta.pluginManager?.rootNode
}
