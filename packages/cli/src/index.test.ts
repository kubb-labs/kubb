import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as generateRunner from './runners/generate/run.ts'
import { run } from './index.ts'

describe('run — generate subcommand dispatch', () => {
  beforeEach(() => {
    process.env['KUBB_DISABLE_TELEMETRY'] = '1'
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('resolves no input override when `generate` is invoked without a positional path', async () => {
    using runSpy = vi.spyOn(generateRunner, 'run').mockResolvedValue(undefined)

    await run(['/usr/bin/node', '/usr/bin/kubb', 'generate', '--config', 'kubb.config.ts'])

    expect(runSpy).toHaveBeenCalledWith(expect.objectContaining({ input: undefined, configPath: 'kubb.config.ts' }))
  })

  it('resolves the OpenAPI path override when `generate` is invoked with a positional path', async () => {
    using runSpy = vi.spyOn(generateRunner, 'run').mockResolvedValue(undefined)

    await run(['/usr/bin/node', '/usr/bin/kubb', 'generate', './openapi.yaml', '--config', 'kubb.config.ts'])

    expect(runSpy).toHaveBeenCalledWith(expect.objectContaining({ input: './openapi.yaml', configPath: 'kubb.config.ts' }))
  })

  it('resolves no input override when no subcommand is given', async () => {
    using runSpy = vi.spyOn(generateRunner, 'run').mockResolvedValue(undefined)

    await run(['/usr/bin/node', '/usr/bin/kubb', '--config', 'kubb.config.ts'])

    expect(runSpy).toHaveBeenCalledWith(expect.objectContaining({ input: undefined, configPath: 'kubb.config.ts' }))
  })
})
