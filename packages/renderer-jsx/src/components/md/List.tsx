import type { Key, KubbReactElement } from '../../types.ts'

type Props = {
  key?: Key
  /**
   * When `true`, emits a numbered list (`1. …`). When `false` or omitted,
   * emits a bullet list (`- …`).
   *
   * @default false
   */
  ordered?: boolean | null
  /**
   * One entry per line. Inline markdown is passed through verbatim.
   */
  items: ReadonlyArray<string>
}

/**
 * Renders a markdown list.
 *
 * Emits a `<File.Source>` block containing one entry per line, prefixed with
 * `1.` / `2.` … when `ordered`, or `-` otherwise.
 *
 * @example
 * ```tsx
 * <List items={['Add the parser', 'Render the page']} />
 * // - Add the parser
 * // - Render the page
 *
 * <List ordered items={['First', 'Second']} />
 * // 1. First
 * // 2. Second
 * ```
 */
export function List({ ordered, items }: Props): KubbReactElement {
  const body = items.map((item, index) => `${ordered ? `${index + 1}.` : '-'} ${item}`).join('\n')
  return <kubb-source name="list">{body}</kubb-source>
}

List.displayName = 'List'
