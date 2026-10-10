import { describe, expect, it } from 'vitest'
import { jsxRenderer } from '../../jsxRenderer.ts'
import { File } from '../File.tsx'
import { List } from './List.tsx'

function firstValue(renderer: ReturnType<typeof jsxRenderer>): string | undefined {
  return (renderer.files[0]?.sources[0]?.nodes?.[0] as { value?: string } | undefined)?.value
}

describe('List', () => {
  it('returns a bulleted list when ordered is not set', async () => {
    const renderer = jsxRenderer()
    await renderer.render(
      <File baseName="post.md" path="src/post.md">
        <List items={['Add the parser', 'Render the page']} />
      </File>,
    )

    expect(firstValue(renderer)).toBe('- Add the parser\n- Render the page')
  })

  it('returns a numbered list when ordered is set', async () => {
    const renderer = jsxRenderer()
    await renderer.render(
      <File baseName="post.md" path="src/post.md">
        <List ordered items={['First', 'Second']} />
      </File>,
    )

    expect(firstValue(renderer)).toBe('1. First\n2. Second')
  })
})
