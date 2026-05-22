import type { Key, KubbReactElement } from '../types.ts'

const CALLOUT_LABEL = {
  tip: 'TIP',
  note: 'NOTE',
  important: 'IMPORTANT',
  warning: 'WARNING',
  caution: 'CAUTION',
} as const

export type CalloutType = keyof typeof CALLOUT_LABEL

type Props = {
  key?: Key
  /**
   * Callout kind. Maps to the uppercase label inside the `> [!TYPE]` marker.
   */
  type: CalloutType
  /**
   * Optional title rendered on the same line as the marker.
   */
  title?: string | null
  /**
   * Body text. Each line is quoted with `> ` so multi-line content stays
   * inside the callout block.
   */
  children: string
}

/**
 * Renders a GitHub-style alert callout — portable across GitHub, GitLab,
 * VitePress, Obsidian, and MDX.
 *
 * Emits a `<File.Source>` block containing `> [!TYPE] Title` followed by the
 * body with every line prefixed by `> `.
 *
 * @example
 * ```tsx
 * <Callout type="tip">Run `kubb start --watch` to keep the generator hot.</Callout>
 * // > [!TIP]
 * // > Run `kubb start --watch` to keep the generator hot.
 *
 * <Callout type="warning" title="Heads up">Breaking change in v6.</Callout>
 * // > [!WARNING] Heads up
 * // > Breaking change in v6.
 * ```
 */
export function Callout({ type, title, children }: Props): KubbReactElement {
  const label = CALLOUT_LABEL[type]
  const header = title ? `> [!${label}] ${title}` : `> [!${label}]`
  const quoted = children
    .trimEnd()
    .split('\n')
    .map((line) => (line.length > 0 ? `> ${line}` : '>'))
    .join('\n')
  return <kubb-source name="callout">{`${header}\n${quoted}`}</kubb-source>
}

Callout.displayName = 'Callout'
