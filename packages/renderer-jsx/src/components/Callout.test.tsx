import { describe, expect, it } from 'vitest'
import { Callout } from './Callout.tsx'
import { renderToText } from './_testUtils.tsx'

describe('Callout', () => {
  it('renders a tip callout without a title', async () => {
    expect(await renderToText(<Callout type="tip">Run `kubb start --watch` to keep the generator hot.</Callout>)).toBe(
      '> [!TIP]\n> Run `kubb start --watch` to keep the generator hot.',
    )
  })

  it('renders a warning callout with a title and multi-line body', async () => {
    expect(
      await renderToText(
        <Callout type="warning" title="Heads up">
          {'body line 1\nline 2'}
        </Callout>,
      ),
    ).toBe('> [!WARNING] Heads up\n> body line 1\n> line 2')
  })

  it('quotes blank lines as a bare `>`', async () => {
    expect(await renderToText(<Callout type="note">{'first paragraph\n\nsecond paragraph'}</Callout>)).toBe(
      '> [!NOTE]\n> first paragraph\n>\n> second paragraph',
    )
  })

  it.each([
    ['tip', 'TIP'],
    ['note', 'NOTE'],
    ['important', 'IMPORTANT'],
    ['warning', 'WARNING'],
    ['caution', 'CAUTION'],
  ] as const)('uses the %s label for type %s', async (type, label) => {
    expect(await renderToText(<Callout type={type}>body</Callout>)).toBe(`> [!${label}]\n> body`)
  })
})
