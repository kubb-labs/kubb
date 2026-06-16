import type { KubbReactElement } from '../types.ts'

type Props = {
  /**
   * Raw JSX string embedded verbatim in the generated code, including
   * fragments (`<>…</>`).
   *
   * @example
   * ```tsx
   * <Jsx>{'<>\n  <a href={href}>Open</a>\n</>'}</Jsx>
   * ```
   */
  children?: string
}

/**
 * Embeds a raw JSX string verbatim in the generated source code.
 *
 * Use this component to include JSX markup (including fragments `<>…</>`) in the
 * body of a generated function or component. The `children` prop must be a plain
 * string. Write expression attributes that reference runtime values as template
 * literals.
 *
 * @example
 * ```tsx
 * <Function name="MyComponent" export>
 *   <Jsx>{'return (\n  <>\n    <div>Hello</div>\n  </>\n)'}</Jsx>
 * </Function>
 * ```
 */
export function Jsx({ children }: Props): KubbReactElement {
  return <kubb-jsx>{children}</kubb-jsx>
}

Jsx.displayName = 'Jsx'
