import type { ast } from '@kubb/ast'
import type { Key, KubbReactElement, KubbReactNode } from '../../types.ts'

type Props = Omit<ast.FunctionNode, 'kind' | 'nodes' | 'params'> & {
  key?: Key
  /** Parameter list, as text or a node from `ast.factory.createFunctionParameters`. */
  params?: string | ast.FunctionParametersNode | null
  /**
   * Child nodes rendered as the body of the function.
   */
  children?: KubbReactNode
}

/**
 * Generates a TypeScript function declaration.
 *
 * @example Async exported function with generics
 * ```tsx
 * <Function export async name="getPet" generics={['TData = Pet']} params="petId: string" returnType="TData">
 *   {`return client.get(\`/pets/\${petId}\`)`}
 * </Function>
 * // export async function getPet<TData = Pet>(petId: string): Promise<TData> {
 * //   return client.get(`/pets/${petId}`)
 * // }
 * ```
 */
export function Function({ children, ...props }: Props): KubbReactElement {
  return <kubb-function {...props}>{children}</kubb-function>
}

type ArrowFunctionProps = Omit<ast.ArrowFunctionNode, 'kind' | 'nodes' | 'params'> & {
  key?: Key
  /** Parameter list, as text or a parameter node. */
  params?: string | ast.FunctionParametersNode | null
  /**
   * Child nodes rendered as the body of the function.
   */
  children?: KubbReactNode
}

/**
 * Generates an arrow function expression assigned to a `const`.
 * Supports the same flags as {@link Function}.
 * Use `singleLine` to render the body as a concise expression rather than a block.
 *
 * @example Single-line arrow function
 * ```tsx
 * <Function.Arrow export name="double" params="n: number" returnType="number" singleLine>
 *   {`n * 2`}
 * </Function.Arrow>
 * // export const double = (n: number): number => n * 2
 * ```
 */
function ArrowFunction({ children, ...props }: ArrowFunctionProps): KubbReactElement {
  return <kubb-arrow-function {...props}>{children}</kubb-arrow-function>
}

Function.Arrow = ArrowFunction
