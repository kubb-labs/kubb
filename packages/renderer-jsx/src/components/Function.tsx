import type { JSDoc, Key, KubbReactElement, KubbReactNode } from '../types.ts'

type Props = {
  key?: Key
  /**
   * Identifier of the generated function declaration.
   *
   * @example
   * `name: 'getPet'`
   */
  name: string
  /**
   * Emit `default` after the `export` keyword, making this the module's default export.
   * Requires `export` to also be `true`.
   * @default false
   */
  default?: boolean
  /**
   * Parameter list written verbatim between the function's parentheses.
   *
   * @example
   * `params: 'petId: string, options?: RequestOptions'`
   */
  params?: string
  /**
   * Emit the `export` keyword before the function declaration.
   * - `true` generates `export function name(…) { … }`
   * - `false` generates `function name(…) { … }`
   * @default false
   */
  export?: boolean
  /**
   * Emit the `async` keyword, making this an async function.
   * The return type is automatically wrapped in `Promise<returnType>` when both
   * `async` and `returnType` are set.
   * @default false
   */
  async?: boolean
  /**
   * TypeScript generic type parameters written verbatim between `<` and `>`.
   * Pass an array to emit multiple parameters separated by commas.
   *
   * @example Single generic
   * `generics: 'TData'`
   *
   * @example Multiple generics
   * `generics: ['TData', 'TError = unknown']`
   */
  generics?: string | string[]
  /**
   * TypeScript return type annotation written verbatim after `:`.
   * When `async` is `true`, the value is automatically wrapped in `Promise<…>`.
   *
   * @example
   * `returnType: 'Pet'`
   */
  returnType?: string
  /**
   * JSDoc block to prepend to the function declaration.
   * Each entry in `comments` becomes one line inside the emitted `/** … *\/` block.
   */
  JSDoc?: JSDoc
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
  const { name, default: isDefault, export: canExport, async: isAsync, generics, params, returnType, JSDoc } = props

  // Normalize generics array to comma-separated string for DOM attribute storage
  const genericsString = Array.isArray(generics) ? generics.join(', ').trim() : generics

  return (
    <kubb-function
      name={name}
      params={params}
      export={canExport}
      default={isDefault}
      async={isAsync}
      generics={genericsString}
      returnType={returnType}
      JSDoc={JSDoc}
    >
      {children}
    </kubb-function>
  )
}

Function.displayName = 'Function'

type ArrowFunctionProps = Props & {
  /**
   * Render the arrow function as a single-line expression (no braces around the body).
   * - `true` generates `const name = (…) => expression`
   * - `false` generates `const name = (…) => { … }`
   * @default false
   */
  singleLine?: boolean
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
function ArrowFunction({ children, ...props }: ArrowFunctionProps) {
  const { name, default: isDefault, export: canExport, async, generics, params, returnType, JSDoc, singleLine } = props

  const genericsString = Array.isArray(generics) ? generics.join(', ').trim() : generics

  return (
    <kubb-arrow-function
      name={name}
      params={params}
      export={canExport}
      default={isDefault}
      async={async}
      generics={genericsString}
      returnType={returnType}
      singleLine={singleLine}
      JSDoc={JSDoc}
    >
      {children}
    </kubb-arrow-function>
  )
}

ArrowFunction.displayName = 'ArrowFunction'
Function.Arrow = ArrowFunction
