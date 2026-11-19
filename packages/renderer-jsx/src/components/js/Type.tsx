import type { ast } from '@kubb/ast'
import type { Key, KubbReactElement, KubbReactNode } from '../../types.ts'

type TypeProps = Omit<ast.TypeNode, 'kind' | 'nodes'> & {
  key?: Key
  /** Doc comment lines, the same as `JSDoc={{ comments }}`. */
  comments?: Array<string | undefined>
  /** Lets importing files use `expression` in place of the name, as on `File.Source`. Read when the declaration sits directly in a `File`. */
  inline?: { expression: string } | null
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
export function Type({ children, comments, JSDoc, ...props }: TypeProps): KubbReactElement {
  if (props.name.charAt(0).toUpperCase() !== props.name.charAt(0)) {
    throw new Error('Name should start with a capital letter(see TypeScript types)')
  }

  return (
    <kubb-type {...props} JSDoc={comments ? { comments } : JSDoc}>
      {children}
    </kubb-type>
  )
}
