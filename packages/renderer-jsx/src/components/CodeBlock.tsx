import type { Key, KubbReactElement } from '../types.ts'

type Props = {
  key?: Key
  /**
   * Language tag for syntax highlighting. Rendered after the opening fence.
   *
   * @example
   * `lang: 'typescript'`
   */
  lang?: string
  /**
   * Code body. Wrapped in triple-backtick fences as-is.
   */
  children: string
}

/**
 * Renders a fenced markdown code block.
 *
 * Emits a `<File.Source>` block containing the children wrapped in
 * triple-backtick fences with an optional language tag.
 *
 * @example
 * ```tsx
 * <CodeBlock lang="typescript">{'const pet = { id: 1 }'}</CodeBlock>
 * // ```typescript
 * // const pet = { id: 1 }
 * // ```
 * ```
 */
export function CodeBlock({ lang, children }: Props): KubbReactElement {
  const fence = `\`\`\`${lang ?? ''}\n${children}\n\`\`\``
  return <kubb-source name="codeBlock">{fence}</kubb-source>
}

CodeBlock.displayName = 'CodeBlock'
