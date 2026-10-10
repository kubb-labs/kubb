import { describe, expect, it } from 'vitest'
import { jsxRenderer } from '../../jsxRenderer.ts'
import { firstValue } from './testing.ts'
import { File } from '../File.tsx'
import { Paragraph } from './Paragraph.tsx'

describe('Paragraph', () => {
  it('returns the body text verbatim', async () => {
    const renderer = jsxRenderer()
    await renderer.render(
      <File baseName="post.md" path="src/post.md">
        <Paragraph>{'A pet object with `id` and `name` fields.'}</Paragraph>
      </File>,
    )

    expect(firstValue(renderer)).toBe('A pet object with `id` and `name` fields.')
  })
})
