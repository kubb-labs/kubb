import { describe, expect, it } from 'vitest'
import { jsxRenderer } from '../../jsxRenderer.ts'
import { firstValue } from './testing.ts'
import { File } from '../File.tsx'
import { Frontmatter } from './Frontmatter.tsx'

describe('Frontmatter', () => {
  it('renders a YAML envelope around the data', async () => {
    const renderer = jsxRenderer()
    await renderer.render(
      <File baseName="post.md" path="src/post.md">
        <Frontmatter data={{ title: 'Hi', tags: ['a', 'b'] }} />
      </File>,
    )

    expect(firstValue(renderer)).toMatchInlineSnapshot(`
      "---
      title: Hi
      tags:
        - a
        - b
      ---"
    `)
  })
})
