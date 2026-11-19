import { ast } from '@kubb/ast'
import { isKubbElement } from '../../jsx-runtime.ts'
import type { Key, KubbReactElement, KubbReactNode } from '../../types.ts'
import { printParams } from './params.ts'

type Params = string | ast.FunctionParametersNode | null

type Props = Omit<ast.FunctionNode, 'kind' | 'nodes' | 'params' | 'JSDoc'> & {
  key?: Key
  /** @deprecated Use `comments`. Removed in Kubb v6. */
  JSDoc?: ast.JSDocNode | null
  /** Parameter list, as text or a node from `ast.factory.createFunctionParameters`. A `Function.Params` child sets it too. */
  params?: Params
  /** Doc comment lines, the same as `JSDoc={{ comments }}`. */
  comments?: Array<string | undefined>
  /** Same as `inline` on `File.Source`. */
  inline?: { expression: string } | null
  /**
   * Child nodes rendered as the body of the function.
   */
  children?: KubbReactNode
}

/** Takes `Function.Params` children out of `children` and prints the parameter list, sorted required, optional, defaulted, then rest. */
function resolveSignature(params: Params | undefined, children: KubbReactNode): { params: string | null | undefined; children: KubbReactNode } {
  const list = Array.isArray(children) ? children : [children]
  const declared = list.filter((child) => isKubbElement(child) && child.type === FunctionParams)
  if (declared.length && params != null) throw new Error('[jsx] Pass either the params prop or a <Function.Params> child, not both')

  const node = declared.length
    ? ast.factory.createFunctionParameters({
        params: declared.flatMap((child) => {
          const { children: items } = (child as KubbReactElement).props as { children?: KubbReactNode }
          return (Array.isArray(items) ? items : [items])
            .filter((item): item is KubbReactElement => isKubbElement(item) && item.type === FunctionParam)
            .map((item) => ast.factory.createFunctionParameter(item.props as FunctionParamProps))
        }),
      })
    : params

  return {
    params: node && typeof node === 'object' ? printParams(node, 'declaration') : node,
    children: declared.length ? list.filter((child) => !declared.includes(child)) : children,
  }
}

function toJSDoc(JSDoc: ast.JSDocNode | null | undefined, comments: Array<string | undefined> | undefined) {
  return comments ? { comments } : JSDoc
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
export function Function({ children, params, comments, JSDoc, ...props }: Props): KubbReactElement {
  const signature = resolveSignature(params, children)
  return (
    <kubb-function {...props} params={signature.params} JSDoc={toJSDoc(JSDoc, comments)}>
      {signature.children}
    </kubb-function>
  )
}

type ArrowFunctionProps = Omit<ast.ArrowFunctionNode, 'kind' | 'nodes' | 'params' | 'JSDoc'> & {
  key?: Key
  /** @deprecated Use `comments`. Removed in Kubb v6. */
  JSDoc?: ast.JSDocNode | null
  /** Parameter list, as text or a parameter node. See {@link Function}. */
  params?: Params
  /** Doc comment lines, the same as `JSDoc={{ comments }}`. */
  comments?: Array<string | undefined>
  /** Same as `inline` on `File.Source`. */
  inline?: { expression: string } | null
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
function ArrowFunction({ children, params, comments, JSDoc, ...props }: ArrowFunctionProps): KubbReactElement {
  const signature = resolveSignature(params, children)
  return (
    <kubb-arrow-function {...props} params={signature.params} JSDoc={toJSDoc(JSDoc, comments)}>
      {signature.children}
    </kubb-arrow-function>
  )
}

type FunctionParamsProps = {
  /** `Function.Param` elements, in declaration order. */
  children?: KubbReactNode
}

/**
 * The parameter list of the enclosing `Function` or `Function.Arrow`, as a direct child.
 *
 * @example
 * ```tsx
 * <Function name="getPet">
 *   <Function.Params>
 *     <Function.Param name="petId" type="string" />
 *     <Function.Param name="config" type="Config" default="{}" />
 *   </Function.Params>
 *   {'return petId'}
 * </Function>
 * // function getPet(petId: string, config: Config = {}) { … }
 * ```
 */
function FunctionParams(_props: FunctionParamsProps): null {
  return null
}

type FunctionParamProps = Parameters<typeof ast.factory.createFunctionParameter>[0]

/**
 * One parameter inside `Function.Params`. Takes the same input as `ast.factory.createFunctionParameter`;
 * `properties` builds a destructured group.
 */
function FunctionParam(_props: FunctionParamProps): null {
  return null
}

type FunctionCallProps = {
  /** The function to call. */
  name: string
  /** The callee's parameter list, printed as call arguments. */
  params?: ast.FunctionParametersNode | null
}

/**
 * A call that passes a parameter list straight through, such as `getPet(petId, config)`.
 *
 * @example
 * ```tsx
 * <Function.Call name="getPet" params={params} />
 * // getPet(petId, config)
 * ```
 */
function FunctionCall({ name, params }: FunctionCallProps): string {
  return `${name}(${params ? printParams(params, 'call') : ''})`
}

Function.Arrow = ArrowFunction
Function.Params = FunctionParams
Function.Param = FunctionParam
Function.Call = FunctionCall
