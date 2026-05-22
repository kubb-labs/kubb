import { describe, expect, it } from 'vitest'
import { jsxRenderer } from '../createRenderer.tsx'
import { File } from './File.tsx'
import { Frontmatter } from './Frontmatter.tsx'

describe('Frontmatter', () => {
  it('renders a YAML envelope around the data', async () => {
    const renderer = jsxRenderer()
    await renderer.render(
      <File baseName="post.md" path="src/post.md">
        <Frontmatter data={{ title: 'Hi', tags: ['a', 'b'] }} />
      </File>,
    )

    expect((renderer.files[0]?.sources[0]?.nodes?.[0] as { value?: string } | undefined)?.value).toBe('---\ntitle: Hi\ntags:\n  - a\n  - b\n---')
    renderer.unmount()
  })
})
