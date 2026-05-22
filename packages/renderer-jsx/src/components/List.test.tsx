import { describe, expect, it } from 'vitest'
import { List } from './List.tsx'
import { renderToText } from './_testUtils.tsx'

describe('List', () => {
  it('renders a bulleted list by default', async () => {
    expect(await renderToText(<List items={['Add the parser', 'Render the page']} />)).toBe('- Add the parser\n- Render the page')
  })

  it('renders a numbered list when `ordered` is set', async () => {
    expect(await renderToText(<List ordered items={['First', 'Second']} />)).toBe('1. First\n2. Second')
  })
})
