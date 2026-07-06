import { describe, expect, it } from 'vitest'
import { jsxRenderer } from '../../jsxRenderer.tsx'
import { File } from '../File.tsx'
import { List } from './List.tsx'

describe('List', () => {
  it('renders a bulleted list by default', async () => {
    const renderer = jsxRenderer()
    await renderer.render(
      <File baseName="post.md" path="src/post.md">
        <List items={['Add the parser', 'Render the page']} />
      </File>,
    )

    expect((renderer.files[0]?.sources[0]?.nodes?.[0] as { value?: string } | undefined)?.value).toMatchInlineSnapshot(`
      "- Add the parser
      - Render the page"
    `)
  })

  it('renders a numbered list when `ordered` is set', async () => {
    const renderer = jsxRenderer()
    await renderer.render(
      <File baseName="post.md" path="src/post.md">
        <List ordered items={['First', 'Second']} />
      </File>,
    )

    expect((renderer.files[0]?.sources[0]?.nodes?.[0] as { value?: string } | undefined)?.value).toMatchInlineSnapshot(`
      "1. First
      2. Second"
    `)
  })
})
