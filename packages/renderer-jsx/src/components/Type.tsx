import type { JSDoc, Key, KubbReactElement, KubbReactNode } from '../types.ts'

export type TypeProps = {
  key?: Key
  /**
   * Identifier of the generated type alias.
   * Must start with an uppercase letter to follow TypeScript naming conventions.
   *
   * @example
   * `name: 'Pet'`
   */
  name: string
  /**
   * Emit the `export` keyword before the type alias declaration.
   * - `true` generates `export type Name = …`
   * - `false` generates `type Name = …`
   * @default false
   */
  export?: boolean
  /**
   * JSDoc block to prepend to the type alias declaration.
   * Each entry in `comments` becomes one line inside the emitted `/** … *\/` block.
   */
  JSDoc?: JSDoc
  /**
   * Child nodes rendered as the type expression on the right-hand side of the alias.
   */
  children?: KubbReactNode
}

/**
 * Generates a TypeScript type alias declaration.
 *
 * Throws if `name` does not start with an uppercase letter — TypeScript type aliases
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
  const { name, export: canExport, JSDoc } = props

  if (name.charAt(0).toUpperCase() !== name.charAt(0)) {
    throw new Error('Name should start with a capital letter(see TypeScript types)')
  }

  return (
    <kubb-type name={name} export={canExport} JSDoc={JSDoc}>
      {children}
    </kubb-type>
  )
}

Type.displayName = 'Type'
