import { describe, expect, it } from 'vitest'
import { Frontmatter } from './Frontmatter.tsx'
import { renderToText } from './_testUtils.tsx'

describe('Frontmatter', () => {
  it('renders a YAML envelope around the data', async () => {
    expect(await renderToText(<Frontmatter data={{ title: 'Hi', tags: ['a', 'b'] }} />)).toBe('---\ntitle: Hi\ntags:\n  - a\n  - b\n---')
  })
})
