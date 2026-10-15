import { ast } from '@kubb/ast'
import { describe, expect, it } from 'vitest'
import { jsxRenderer } from '../../jsxRenderer.ts'
import { firstValue } from './testing.ts'
import { File } from '../File.tsx'
import { Heading } from './Heading.tsx'
import { Paragraph } from './Paragraph.tsx'

describe('Heading', () => {
  it('renders an ATX heading with the requested level', async () => {
    const renderer = jsxRenderer()
    await renderer.render(
      <File baseName="post.md" path="src/post.md">
        <Heading level={2}>Installation</Heading>
      </File>,
    )

    expect(firstValue(renderer)).toMatchInlineSnapshot(`"## Installation"`)
  })

  it('keeps every heading and a repeated paragraph of one file, in order', async () => {
    const renderer = jsxRenderer()
    await renderer.render(
      <File baseName="post.md" path="src/post.md">
        <Heading level={2}>listPets</Heading>
        <Paragraph>Deprecated.</Paragraph>
        <Heading level={2}>deletePet</Heading>
        <Paragraph>Deprecated.</Paragraph>
      </File>,
    )

    // Kubb stores every rendered file through `createFile`, which drops duplicate sources.
    const values = ast.factory.createFile(renderer.files[0]!).sources.map((source) => source.nodes?.map((node) => ('value' in node ? node.value : '')).join(''))
    expect(values).toStrictEqual(['## listPets', 'Deprecated.', '## deletePet', 'Deprecated.'])
  })
})
