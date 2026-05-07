import { describe, expect, it, vi } from 'vitest'

const runGenerateCommand = vi.fn(async () => undefined)

vi.mock('../runners/generate.ts', () => ({
  runGenerateCommand,
}))

describe('generate command', () => {
  it('forwards the adapter flag to the generate runner', async () => {
    const { command } = await import('./generate.ts')

    expect(command.run).toBeTypeOf('function')

    await command.run?.({
      values: {
        adapter: 'oas',
        config: './kubb.config.ts',
        debug: false,
        logLevel: 'info',
        silent: false,
        verbose: false,
        watch: false,
      },
      positionals: ['spec.yaml'],
    })

    expect(runGenerateCommand).toHaveBeenCalledWith({
      adapter: 'oas',
      configPath: './kubb.config.ts',
      input: 'spec.yaml',
      logLevel: 'info',
      watch: false,
    })
  })
})
