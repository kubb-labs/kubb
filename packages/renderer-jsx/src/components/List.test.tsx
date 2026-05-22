import { describe, expect, it } from 'vitest'
import { jsxRenderer } from '../createRenderer.tsx'
import { File } from './File.tsx'
import { List } from './List.tsx'

describe('List', () => {
  it('renders a bulleted list by default', async () => {
    const renderer = jsxRenderer()
    await renderer.render(
      <File baseName="post.md" path="src/post.md">
        <List items={['Add the parser', 'Render the page']} />
      </File>,
    )

    expect((renderer.files[0]?.sources[0]?.nodes?.[0] as { value?: string } | undefined)?.value).toBe('- Add the parser\n- Render the page')
    renderer.unmount()
  })

  it('renders a numbered list when `ordered` is set', async () => {
    const renderer = jsxRenderer()
    await renderer.render(
      <File baseName="post.md" path="src/post.md">
        <List ordered items={['First', 'Second']} />
      </File>,
    )

    expect((renderer.files[0]?.sources[0]?.nodes?.[0] as { value?: string } | undefined)?.value).toBe('1. First\n2. Second')
    renderer.unmount()
  })
})
