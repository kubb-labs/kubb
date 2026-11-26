import { describe, expect, it } from 'vitest'
import { tools } from './server.ts'

type ToolDefinition = {
  name: string
  title?: string
  description: string
  annotations?: { readOnlyHint?: boolean; destructiveHint?: boolean; idempotentHint?: boolean; openWorldHint?: boolean }
}

const definitions = tools as unknown as Array<ToolDefinition>
const byName = (name: string) => definitions.find((definition) => definition.name === name)

describe('tools', () => {
  it('names each tool after its CLI command, with the kubb_ prefix', () => {
    expect(definitions.map((definition) => definition.name)).toEqual([
      'kubb_generate',
      'kubb_diff',
      'kubb_validate',
      'kubb_init',
      'kubb_add',
      'kubb_update',
      'kubb_remove',
      'kubb_list',
    ])
  })

  it.each(definitions)('describes $name in three sentences or more, with a title', ({ title, description }) => {
    expect(title).toBeTruthy()
    expect(description.split(/\.(?:\s|$)/).filter(Boolean).length).toBeGreaterThanOrEqual(3)
  })

  it.each(['kubb_validate', 'kubb_diff', 'kubb_list'])('marks %s as read-only', (name) => {
    expect(byName(name)?.annotations).toMatchObject({ readOnlyHint: true })
  })

  it.each([
    ['kubb_remove', true],
    ['kubb_generate', true],
    ['kubb_update', true],
    ['kubb_init', false],
    ['kubb_add', false],
  ])('sets destructiveHint of %s to %s', (name, destructiveHint) => {
    expect(byName(name)?.annotations).toMatchObject({ destructiveHint })
  })

  it.each(['kubb_add', 'kubb_update', 'kubb_remove', 'kubb_list'])('marks %s, which reads the registry, as open world', (name) => {
    expect(byName(name)?.annotations).toMatchObject({ openWorldHint: true })
  })
})
