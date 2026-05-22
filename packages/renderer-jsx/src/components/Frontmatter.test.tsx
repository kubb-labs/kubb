import { describe, expect, it } from 'vitest'
import { jsxRenderer } from '../createRenderer.tsx'
import { File } from './File.tsx'
import { Frontmatter } from './Frontmatter.tsx'

function firstSourceText(renderer: { files: ReadonlyArray<{ sources: ReadonlyArray<{ nodes?: unknown }> }> }) {
  const nodes = renderer.files[0]?.sources[0]?.nodes as Array<{ kind: string; value?: string }> | undefined
  return nodes?.find((node) => node.kind === 'Text')?.value
}

describe('Frontmatter', () => {
  it('renders a YAML envelope around the data', async () => {
    const renderer = jsxRenderer()
    await renderer.render(
      <File baseName="post.md" path="src/post.md">
        <Frontmatter data={{ title: 'Hi', tags: ['a', 'b'] }} />
      </File>,
    )

    expect(firstSourceText(renderer)).toBe('---\ntitle: Hi\ntags:\n  - a\n  - b\n---')
    renderer.unmount()
  })
})
