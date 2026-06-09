import { describe, expect, it } from 'vitest'
import { jsxRenderer } from '../createRenderer.tsx'
import { Callout } from './Callout.tsx'
import { File } from './File.tsx'

describe('Callout', () => {
  it('renders a tip callout without a title', async () => {
    const renderer = jsxRenderer()
    await renderer.render(
      <File baseName="post.md" path="src/post.md">
        <Callout type="tip">Run `kubb start --watch` to keep the generator hot.</Callout>
      </File>,
    )

    expect((renderer.files[0]?.sources[0]?.nodes?.[0] as { value?: string } | undefined)?.value).toMatchInlineSnapshot(`
      "> [!TIP]
      > Run \`kubb start --watch\` to keep the generator hot."
    `)
  })

  it('renders a warning callout with a title and multi-line body', async () => {
    const renderer = jsxRenderer()
    await renderer.render(
      <File baseName="post.md" path="src/post.md">
        <Callout type="warning" title="Heads up">
          {'body line 1\nline 2'}
        </Callout>
      </File>,
    )

    expect((renderer.files[0]?.sources[0]?.nodes?.[0] as { value?: string } | undefined)?.value).toMatchInlineSnapshot(`
      "> [!WARNING] Heads up
      > body line 1
      > line 2"
    `)
  })

  it('quotes blank lines as a bare `>`', async () => {
    const renderer = jsxRenderer()
    await renderer.render(
      <File baseName="post.md" path="src/post.md">
        <Callout type="note">{'first paragraph\n\nsecond paragraph'}</Callout>
      </File>,
    )

    expect((renderer.files[0]?.sources[0]?.nodes?.[0] as { value?: string } | undefined)?.value).toMatchInlineSnapshot(`
      "> [!NOTE]
      > first paragraph
      >
      > second paragraph"
    `)
  })

  it('uses the TIP label for type tip', async () => {
    const renderer = jsxRenderer()
    await renderer.render(
      <File baseName="post.md" path="src/post.md">
        <Callout type="tip">body</Callout>
      </File>,
    )

    expect((renderer.files[0]?.sources[0]?.nodes?.[0] as { value?: string } | undefined)?.value).toMatchInlineSnapshot(`
      "> [!TIP]
      > body"
    `)
  })

  it('uses the NOTE label for type note', async () => {
    const renderer = jsxRenderer()
    await renderer.render(
      <File baseName="post.md" path="src/post.md">
        <Callout type="note">body</Callout>
      </File>,
    )

    expect((renderer.files[0]?.sources[0]?.nodes?.[0] as { value?: string } | undefined)?.value).toMatchInlineSnapshot(`
      "> [!NOTE]
      > body"
    `)
  })

  it('uses the IMPORTANT label for type important', async () => {
    const renderer = jsxRenderer()
    await renderer.render(
      <File baseName="post.md" path="src/post.md">
        <Callout type="important">body</Callout>
      </File>,
    )

    expect((renderer.files[0]?.sources[0]?.nodes?.[0] as { value?: string } | undefined)?.value).toMatchInlineSnapshot(`
      "> [!IMPORTANT]
      > body"
    `)
  })

  it('uses the WARNING label for type warning', async () => {
    const renderer = jsxRenderer()
    await renderer.render(
      <File baseName="post.md" path="src/post.md">
        <Callout type="warning">body</Callout>
      </File>,
    )

    expect((renderer.files[0]?.sources[0]?.nodes?.[0] as { value?: string } | undefined)?.value).toMatchInlineSnapshot(`
      "> [!WARNING]
      > body"
    `)
  })

  it('uses the CAUTION label for type caution', async () => {
    const renderer = jsxRenderer()
    await renderer.render(
      <File baseName="post.md" path="src/post.md">
        <Callout type="caution">body</Callout>
      </File>,
    )

    expect((renderer.files[0]?.sources[0]?.nodes?.[0] as { value?: string } | undefined)?.value).toMatchInlineSnapshot(`
      "> [!CAUTION]
      > body"
    `)
  })
})
