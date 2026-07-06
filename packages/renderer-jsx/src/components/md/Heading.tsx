import type { Key, KubbReactElement } from '../../types.ts'

type Level = 1 | 2 | 3 | 4 | 5 | 6

type Props = {
  key?: Key
  /**
   * Heading depth, `1` through `6`. Matches the number of `#` characters
   * prefixed to the heading text.
   */
  level: Level
  /**
   * Heading text. Inline markdown (links, emphasis) is passed through verbatim.
   */
  children: string
}

/**
 * Renders an ATX-style markdown heading.
 *
 * Emits a `<File.Source>` block containing `${'#'.repeat(level)} ${children}`.
 * Use inside a `<File>` rendered by `parserMd`.
 *
 * @example
 * ```tsx
 * <Heading level={2}>Installation</Heading>
 * // ## Installation
 * ```
 */
export function Heading({ level, children }: Props): KubbReactElement {
  return <kubb-source name="heading">{`${'#'.repeat(level)} ${children}`}</kubb-source>
}

Heading.displayName = 'Heading'
