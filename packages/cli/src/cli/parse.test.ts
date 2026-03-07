import { describe, expect, it, vi } from 'vitest'
import type { CLIAdapter, CommandDefinition, RunOptions } from './types.ts'
import { createCLI } from './parse.ts'

const opts: RunOptions = { programName: 'kubb', defaultCommandName: 'generate', version: '1.0.0' }

describe('createCLI', () => {
  it('returns an object with a run method', () => {
    const cli = createCLI()
    expect(typeof cli.run).toBe('function')
  })

  it('uses the provided custom adapter', async () => {
    const mockRun = vi.fn().mockResolvedValue(undefined)
    const adapter: CLIAdapter = { run: mockRun, renderHelp: vi.fn() }
    const commands: CommandDefinition[] = [{ name: 'generate', description: 'Generate' }]
    const cli = createCLI({ adapter })

    await cli.run(commands, ['generate'], opts)

    expect(mockRun).toHaveBeenCalledWith(commands, ['generate'], opts)
  })

  it('passes all arguments through to the adapter', async () => {
    const mockRun = vi.fn().mockResolvedValue(undefined)
    const adapter: CLIAdapter = { run: mockRun, renderHelp: vi.fn() }
    const cli = createCLI({ adapter })
    const commands: CommandDefinition[] = []
    const argv = ['--version']

    await cli.run(commands, argv, opts)

    expect(mockRun).toHaveBeenCalledWith(commands, argv, opts)
  })

  it('creates independent CLI instances per call', () => {
    const cli1 = createCLI()
    const cli2 = createCLI()
    expect(cli1).not.toBe(cli2)
  })
})
