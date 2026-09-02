import { createMockedAdapter } from '@kubb/core/mocks'
import { Hookable, memoryStorage, type Config, type KubbHooks } from '@kubb/core'
import { describe, expect, it, vi } from 'vitest'
import { generate } from './generate.ts'
import type { AgentHooks } from './hooks.ts'

vi.mock('@internals/utils', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@internals/utils')>()),
  detectTool: vi.fn(async () => null),
}))

function makeConfig(output: Config['output']): Config {
  return {
    root: '.',
    input: './petStore.yaml',
    output,
    parsers: [],
    reporters: [],
    adapter: createMockedAdapter(),
    plugins: [],
    storage: memoryStorage(),
  }
}

/**
 * Stands in for the host's `kubb:hook:start` listener (spawning the real formatter/linter), so a
 * test can assert on `generate`'s own messages without depending on a tool actually being installed.
 */
function respondToHooks(hooks: Hookable<AgentHooks>) {
  hooks.hook('kubb:hook:start', async ({ id, command, args }) => {
    await hooks.callHook('kubb:hook:end', { id, command, args, success: true, error: null })
  })
}

describe('generate: format/lint tool step messages', () => {
  it('reports a successful lint pass, not just a successful format pass', async () => {
    const hooks = new Hookable<AgentHooks & KubbHooks>()
    respondToHooks(hooks)
    const successes: Array<string> = []
    hooks.hook('kubb:success', ({ message }) => successes.push(message))

    await generate({ config: makeConfig({ path: './gen', lint: 'oxlint' }), hooks })

    expect(successes).toContain('Linting with oxlint successfully')
  })

  it('warns with the linter-not-found message when no linter is installed', async () => {
    const hooks = new Hookable<AgentHooks & KubbHooks>()
    const warnings: Array<string> = []
    hooks.hook('kubb:warn', ({ message }) => warnings.push(message))

    await generate({ config: makeConfig({ path: './gen', lint: 'auto' }), hooks })

    expect(warnings).toContain('No linter found (oxlint, biome, eslint). Skipping linting.')
  })
})
