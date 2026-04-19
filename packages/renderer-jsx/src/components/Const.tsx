import type { JSDoc, Key, KubbReactElement, KubbReactNode } from '../types.ts'

type ConstProps = {
  key?: Key
  /**
   * Identifier of the generated constant declaration.
   *
   * @example
   * `name: 'petSchema'`
   */
  name: string
  /**
   * Emit the `export` keyword before the `const` declaration.
   * - `true` generates `export const name = …`
   * - `false` generates `const name = …`
   * @default false
   */
  export?: boolean
  /**
   * TypeScript type annotation for the constant, written verbatim after `const name:`.
   *
   * @example
   * `type: 'Pet'` → `const pet: Pet = …`
   */
  type?: string
  /**
   * JSDoc block to prepend to the constant declaration.
   * Each entry in `comments` becomes one line inside the emitted `/** … *\/` block.
   */
  JSDoc?: JSDoc
  /**
   * Append `as const` after the initialiser, enabling TypeScript const assertions.
   * - `true` generates `const name = … as const`
   * - `false` generates `const name = …`
   * @default false
   */
  asConst?: boolean
  /**
   * Child nodes rendered as the initialiser expression of the constant.
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
export function Const({ children, ...props }: ConstProps): KubbReactElement {
  const { name, export: canExport, type, JSDoc, asConst } = props

  return (
    <kubb-const name={name} type={type} export={canExport} asConst={asConst} JSDoc={JSDoc}>
      {children}
    </kubb-const>
  )
}

Const.displayName = 'Const'
