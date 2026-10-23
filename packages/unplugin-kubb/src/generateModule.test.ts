import { createMockedAdapter } from '@kubb/core/mocks'
import type { UserConfig } from '@kubb/core'
import { pluginBarrel } from '@kubb/plugin-barrel'
import { describe, expect, test } from 'vitest'
import { createSchemaPlugin, schemaAdapter } from './__mocks__/schemaPlugin.ts'
import { generateModule } from './generateModule.ts'

describe('generateModule', () => {
  test('merges the output of every plugin into one module without imports between them', async () => {
    const config: UserConfig = {
      output: { path: './gen' },
      adapter: schemaAdapter,
      plugins: [createSchemaPlugin('a'), createSchemaPlugin('b', 'a'), pluginBarrel()],
    }
    const { text, errors } = await generateModule({ root: '/app/src', input: '/app/src/pet.openapi.yaml', config })

    expect(errors).toStrictEqual([])
    expect(text).toContain('export type a_Pet = { id: number }')
    expect(text).toContain('export type a_Tag = { id: number }')
    expect(text).toContain('export const b_Pet: a_Pet = { id: 1 }')
    expect(text).not.toMatch(/^import /m)
  })

  test('merges a plugin configured with an explicit directory output too', async () => {
    const plugin = { ...createSchemaPlugin('a'), options: { output: { path: 'a', mode: 'directory' } } }
    const { text } = await generateModule({
      root: '/app/src',
      input: '/app/src/pet.openapi.yaml',
      config: { output: { path: './gen' }, adapter: schemaAdapter, plugins: [plugin] },
    })

    expect(text).toContain('export type a_Pet = { id: number }')
  })

  test('returns no module and the errors of a failed build', async () => {
    const adapter = createMockedAdapter({
      async parse() {
        throw new Error('Cannot read the spec')
      },
    })
    const { text, errors } = await generateModule({
      root: '/app/src',
      input: '/app/src/pet.openapi.yaml',
      config: { output: { path: './gen' }, adapter, plugins: [createSchemaPlugin('a')] },
    })

    expect(text).toBeNull()
    expect(errors.map((error) => error.message).join('\n')).toContain('Cannot read the spec')
  })
})
