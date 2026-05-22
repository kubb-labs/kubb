import { describe, expect, it } from 'vitest'
import { jsxRenderer } from '../createRenderer.tsx'
import { File } from './File.tsx'
import { List } from './List.tsx'

function firstSourceText(renderer: { files: ReadonlyArray<{ sources: ReadonlyArray<{ nodes?: unknown }> }> }) {
  const nodes = renderer.files[0]?.sources[0]?.nodes as Array<{ kind: string; value?: string }> | undefined
  return nodes?.find((node) => node.kind === 'Text')?.value
}

describe('List', () => {
  it('renders a bulleted list by default', async () => {
    const renderer = jsxRenderer()
    await renderer.render(
      <File baseName="post.md" path="src/post.md">
        <List items={['Add the parser', 'Render the page']} />
      </File>,
    )

    expect(firstSourceText(renderer)).toBe('- Add the parser\n- Render the page')
    renderer.unmount()
  })

  it('renders a numbered list when `ordered` is set', async () => {
    const renderer = jsxRenderer()
    await renderer.render(
      <File baseName="post.md" path="src/post.md">
        <List ordered items={['First', 'Second']} />
      </File>,
    )

    expect(firstSourceText(renderer)).toBe('1. First\n2. Second')
    renderer.unmount()
  })
})
