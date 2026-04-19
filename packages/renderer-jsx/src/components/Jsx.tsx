import type { KubbReactElement } from "../types.ts";

type Props = {
  /**
   * Raw JSX string to embed verbatim in the generated code.
   * Supports JSX fragments (`<>…</>`), elements, and any valid JSX syntax.
   * @example
   * ```tsx
   * <Jsx>{'<>\n  <a href={href}>Open</a>\n</>'}</Jsx>
   * ```
   */
  children?: string;
};

/**
 * Embeds a raw JSX string verbatim in the generated source code.
 *
 * Use this component when you need to include JSX markup (including fragments
 * `<>…</>`) in the body of a generated function or component. The `children`
 * prop must be a plain string — expression attributes that reference runtime
 * values should be written as template literals.
 *
 * @example
 * ```tsx
 * <Function name="MyComponent" export>
 *   <Jsx>{'return (\n  <>\n    <div>Hello</div>\n  </>\n)'}</Jsx>
 * </Function>
 * ```
 */
export function Jsx({ children }: Props): KubbReactElement {
  return <kubb-jsx>{children}</kubb-jsx>;
}

Jsx.displayName = "Jsx";
