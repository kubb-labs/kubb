import { describe, expect, it } from 'vitest'
import { jsxRenderer } from '../createRenderer.tsx'
import { CodeBlock } from './CodeBlock.tsx'
import { File } from './File.tsx'
import { Frontmatter } from './Frontmatter.tsx'
import { Heading } from './Heading.tsx'
import { List } from './List.tsx'
import { Paragraph } from './Paragraph.tsx'

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

describe('Heading', () => {
  it('renders an ATX heading with the requested level', async () => {
    const renderer = jsxRenderer()
    await renderer.render(
      <File baseName="post.md" path="src/post.md">
        <Heading level={2}>Installation</Heading>
      </File>,
    )

    expect(firstSourceText(renderer)).toBe('## Installation')
    renderer.unmount()
  })
})

describe('Paragraph', () => {
  it('renders body text verbatim', async () => {
    const renderer = jsxRenderer()
    await renderer.render(
      <File baseName="post.md" path="src/post.md">
        <Paragraph>{'A pet object with `id` and `name` fields.'}</Paragraph>
      </File>,
    )

    expect(firstSourceText(renderer)).toBe('A pet object with `id` and `name` fields.')
    renderer.unmount()
  })
})

describe('CodeBlock', () => {
  it('wraps children in fenced code with a language tag', async () => {
    const renderer = jsxRenderer()
    await renderer.render(
      <File baseName="post.md" path="src/post.md">
        <CodeBlock lang="typescript">{'const pet = { id: 1 }'}</CodeBlock>
      </File>,
    )

    expect(firstSourceText(renderer)).toBe('```typescript\nconst pet = { id: 1 }\n```')
    renderer.unmount()
  })

  it('omits the language tag when none is provided', async () => {
    const renderer = jsxRenderer()
    await renderer.render(
      <File baseName="post.md" path="src/post.md">
        <CodeBlock>{'echo hi'}</CodeBlock>
      </File>,
    )

    expect(firstSourceText(renderer)).toBe('```\necho hi\n```')
    renderer.unmount()
  })
})

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
