import type { ast } from '@kubb/ast'
import { jsx } from '../../jsx-runtime.ts'
import type { Key, KubbReactElement, KubbReactNode } from '../../types.ts'

type ConstProps = Omit<ast.ConstNode, 'kind' | 'nodes'> & {
  key?: Key
  /**
   * Child nodes rendered as the initializer expression of the constant.
   */
  children?: KubbReactNode
}

/**
 * Generates a TypeScript constant declaration.
 *
 * @example Named export with type annotation
 * ```tsx
 * <Const export name="petSchema" type="z.ZodType<Pet>">
 *   {`z.object({ id: z.number() })`}
 * </Const>
 * // export const petSchema: z.ZodType<Pet> = z.object({ id: z.number() })
 * ```
 *
 * @example With JSDoc and const assertion
 * ```tsx
 * <Const name="HTTP_METHODS" asConst JSDoc={{ comments: ['@description Supported HTTP methods.'] }}>
 *   {`['GET', 'POST', 'PUT', 'DELETE']`}
 * </Const>
 * ```
 */
export function Const(props: ConstProps): KubbReactElement {
  return jsx('kubb-const', props)
}
