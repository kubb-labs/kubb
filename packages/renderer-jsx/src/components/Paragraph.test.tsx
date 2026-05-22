import { describe, expect, it } from 'vitest'
import { Paragraph } from './Paragraph.tsx'
import { renderToText } from './_testUtils.tsx'

describe('Paragraph', () => {
  it('renders body text verbatim', async () => {
    expect(await renderToText(<Paragraph>{'A pet object with `id` and `name` fields.'}</Paragraph>)).toBe('A pet object with `id` and `name` fields.')
  })
})
