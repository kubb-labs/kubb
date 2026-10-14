import type { ast } from '@kubb/ast'
import type { Key, KubbReactElement, KubbReactNode } from '../../types.ts'

type TypeProps = Omit<ast.TypeNode, 'kind' | 'nodes'> & {
  key?: Key
  /**
   * Child nodes rendered as the type expression on the right-hand side of the alias.
   */
  children?: KubbReactNode
}

/**
 * Generates a TypeScript type alias declaration.
 *
 * Throws if `name` does not start with an uppercase letter. TypeScript type aliases
 * should follow PascalCase naming conventions.
 *
 * @example Simple exported type alias
 * ```tsx
 * <Type export name="PetId">
 *   {`string | number`}
 * </Type>
 * // export type PetId = string | number
 * ```
 *
 * @example Type alias with JSDoc
 * ```tsx
 * <Type export name="Pet" JSDoc={{ comments: ['@description A pet in the store.'] }}>
 *   {`{ id: number; name: string }`}
 * </Type>
 * ```
 */
export function Type({ children, ...props }: TypeProps): KubbReactElement {
  if (props.name.charAt(0).toUpperCase() !== props.name.charAt(0)) {
    throw new Error('Name should start with a capital letter(see TypeScript types)')
  }

  return <kubb-type {...props}>{children}</kubb-type>
}
