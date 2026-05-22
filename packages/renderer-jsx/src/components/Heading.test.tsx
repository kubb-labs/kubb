import { describe, expect, it } from 'vitest'
import { Heading } from './Heading.tsx'
import { renderToText } from './_testUtils.tsx'

describe('Heading', () => {
  it('renders an ATX heading with the requested level', async () => {
    expect(await renderToText(<Heading level={2}>Installation</Heading>)).toBe('## Installation')
  })
})
