import { stringify } from 'yaml'
import type { Key, KubbReactElement } from '../../types.ts'

type Props = {
  key?: Key
  /**
   * Plain object serialized as YAML between `---` fences.
   *
   * @example
   * `{ title: 'Pets', layout: 'doc' }`
   */
  data: Record<string, unknown>
}

/**
 * Emits a YAML frontmatter envelope at the top of a generated markdown file.
 *
 * Renders a `<File.Source>` block containing `---\n<yaml>\n---`. Place it as
 * the first child of `<File>` so it appears at the top of the output. Pair with
 * `parserMd` to write `.md` files whose frontmatter downstream tooling can read.
 *
 * @example Page frontmatter at the top of a generated markdown file
 * ```tsx
 * <File baseName="pets.md" path="src/pets.md">
 *   <Frontmatter data={{ title: 'Pets', layout: 'doc' }} />
 *   <File.Source>
 *     {'# Pets\n\nList of pets.'}
 *   </File.Source>
 * </File>
 * ```
 */
export function Frontmatter({ data }: Props): KubbReactElement {
  const envelope = Object.keys(data).length === 0 ? '' : `---\n${stringify(data).trimEnd()}\n---`
  return <kubb-source name="frontmatter">{envelope}</kubb-source>
}

Frontmatter.displayName = 'Frontmatter'
