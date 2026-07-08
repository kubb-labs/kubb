import type { Key, KubbReactElement, KubbReactNode } from './types.ts'

/**
 * Brand marking a Kubb JSX element's `$$typeof`. `Symbol.for` resolves to one key across
 * duplicated `@kubb/renderer-jsx` copies, and its value tells a Kubb element apart from a React
 * element (which brands its own `$$typeof`), so the renderer never walks a foreign tree.
 */
export const KUBB_ELEMENT = Symbol.for('kubb.element')

/**
 * Fragment marker. A `<>…</>` compiles to `jsx(Fragment, …)`, and the renderer
 * unwraps it while walking the tree.
 */
export const Fragment = Symbol.for('kubb.fragment')

/**
 * Create a Kubb JSX element. The automatic JSX runtime calls this for every tag,
 * so the renderer never depends on React at runtime. The `type` is a host
 * string, a function component, or `Fragment`, and children are folded into
 * `props`.
 */
function createElement(type: unknown, props: Record<string, unknown> | null, key?: Key | null): KubbReactElement {
  return { $$typeof: KUBB_ELEMENT, type, key: key ?? null, props: props ?? {} } as unknown as KubbReactElement
}

export const jsx = createElement
export const jsxs = createElement
export const jsxDEV = createElement

export type * from './jsx-namespace.d.ts'

export type JSXElement = KubbReactElement
export type ReactNode = KubbReactNode
