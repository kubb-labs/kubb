import { describe, expect, it } from 'vitest'
import { CodeBlock } from './CodeBlock.tsx'
import { renderToText } from './_testUtils.tsx'

describe('CodeBlock', () => {
  it('wraps children in fenced code with a language tag', async () => {
    expect(await renderToText(<CodeBlock lang="typescript">{'const pet = { id: 1 }'}</CodeBlock>)).toBe('```typescript\nconst pet = { id: 1 }\n```')
  })

  it('omits the language tag when none is provided', async () => {
    expect(await renderToText(<CodeBlock>{'echo hi'}</CodeBlock>)).toBe('```\necho hi\n```')
  })
})
