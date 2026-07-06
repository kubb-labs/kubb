import type { Key, KubbReactElement } from '../../types.ts'

type Props = {
  key?: Key
  /**
   * Paragraph text. Inline markdown (links, emphasis, code spans) is passed
   * through verbatim.
   */
  children: string
}

/**
 * Renders a markdown paragraph.
 *
 * Emits a `<File.Source>` block containing the text as-is. Paragraphs are
 * separated from surrounding blocks by blank lines via the parser's source
 * joining.
 *
 * @example
 * ```tsx
 * <Paragraph>{'A pet object with `id` and `name` fields.'}</Paragraph>
 * ```
 */
export function Paragraph({ children }: Props): KubbReactElement {
  return <kubb-source name="paragraph">{children}</kubb-source>
}

Paragraph.displayName = 'Paragraph'
