import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CommandDefinition } from './defineCommand.ts'
import { type RunOptions, runCLI } from './runCLI.ts'

const opts: RunOptions = {
  programName: 'kubb',
  defaultCommandName: 'generate',
  version: '2.0.0',
}

function makeCmd(name: string, run?: (args: { values: Record<string, unknown>; positionals: Array<string> }) => Promise<void>): CommandDefinition {
  return {
    name,
    description: `${name} command`,
    options: { config: { type: 'string', description: 'Config', short: 'c' } },
    run,
  }
}

describe('runCLI', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(process, 'exit').mockImplementation((code?: string | number | null) => {
      throw new Error(`exit:${code ?? 0}`)
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  function logOutput(): string {
    return consoleSpy.mock.calls.flat().join('\n')
  }

  describe('--version / -v', () => {
    it.each(['--version', '-v'])('prints version and exits 0 on %s', async (flag) => {
      await expect(runCLI([], [flag], opts)).rejects.toThrow('exit:0')
      expect(consoleSpy).toHaveBeenCalledWith('2.0.0')
    })
  })

  describe('--help / -h', () => {
    it.each(['--help', '-h'])('prints root help and exits 0 on %s', async (flag) => {
      await expect(runCLI([makeCmd('generate')], [flag], opts)).rejects.toThrow('exit:0')
      expect(logOutput()).toContain('generate')
    })
  })

  describe('argv stripping', () => {
    it('strips leading node/script entries when argv[0] includes "node"', async () => {
      const runFn = vi.fn().mockResolvedValue(undefined)
      await runCLI([makeCmd('generate', runFn)], ['/usr/bin/node', 'kubb.js', 'generate'], opts)
      expect(runFn).toHaveBeenCalled()
    })

    it('strips leading bun/script entries when run via bunx', async () => {
      const runFn = vi.fn().mockResolvedValue(undefined)
      await runCLI([makeCmd('generate', runFn)], ['/usr/local/bin/bun', 'kubb.js', 'generate'], opts)
      expect(runFn).toHaveBeenCalled()
    })

    it('strips leading deno/script entries when run via deno', async () => {
      const runFn = vi.fn().mockResolvedValue(undefined)
      await runCLI([makeCmd('generate', runFn)], ['/usr/bin/deno', 'kubb.js', 'generate'], opts)
      expect(runFn).toHaveBeenCalled()
    })

    it('does not strip when argv[0] does not contain a path separator', async () => {
      const runFn = vi.fn().mockResolvedValue(undefined)
      await runCLI([makeCmd('generate', runFn)], ['generate'], opts)
      expect(runFn).toHaveBeenCalled()
    })

    it('passes the OpenAPI input positional correctly when run via bunx', async () => {
      const runFn = vi.fn().mockResolvedValue(undefined)
      await runCLI([makeCmd('generate', runFn)], ['/usr/local/bin/bun', 'kubb.js', 'generate', './openapi.yaml'], opts)
      expect(runFn).toHaveBeenCalledWith(expect.objectContaining({ positionals: ['./openapi.yaml'] }))
    })
  })

  describe('empty args', () => {
    it('runs default command when no args provided', async () => {
      const runFn = vi.fn().mockResolvedValue(undefined)
      await runCLI([makeCmd('generate', runFn)], [], opts)
      expect(runFn).toHaveBeenCalledWith({ values: {}, positionals: [] })
    })

    it('shows root help when default command has no run', async () => {
      await runCLI([makeCmd('generate')], [], opts)
      expect(logOutput()).toContain('kubb')
    })
  })

  describe('known command routing', () => {
    it('runs a known command', async () => {
      const runFn = vi.fn().mockResolvedValue(undefined)
      await runCLI([makeCmd('generate', runFn)], ['generate'], opts)
      expect(runFn).toHaveBeenCalled()
    })

    it('routes unrecognized first arg to default command', async () => {
      const runFn = vi.fn().mockResolvedValue(undefined)
      await runCLI([makeCmd('generate', runFn)], ['--config', 'kubb.config.ts'], opts)
      expect(runFn).toHaveBeenCalled()
    })

    it('passes flags as values to the command', async () => {
      const runFn = vi.fn().mockResolvedValue(undefined)
      await runCLI([makeCmd('generate', runFn)], ['generate', '--config', 'my.config.ts'], opts)
      expect(runFn).toHaveBeenCalledWith(
        expect.objectContaining({
          values: expect.objectContaining({ config: 'my.config.ts' }),
        }),
      )
    })

    it('shows command help on --help flag', async () => {
      await expect(runCLI([makeCmd('generate')], ['generate', '--help'], opts)).rejects.toThrow('exit:0')
    })

    it('shows command help and exits 0 when command has no run', async () => {
      await expect(runCLI([makeCmd('generate')], ['generate'], opts)).rejects.toThrow('exit:0')
    })
  })

  describe('unknown top-level command', () => {
    it('prints error and exits 1 when no matching command found', async () => {
      const cmd = makeCmd('validate')
      await expect(runCLI([cmd], ['unknown-cmd'], opts)).rejects.toThrow('exit:1')
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('unknown-cmd'))
    })
  })

  describe('subcommand routing', () => {
    const agentWithStart = (startFn?: () => Promise<void>): CommandDefinition => ({
      name: 'agent',
      description: 'Agent',
      subCommands: [{ name: 'start', description: 'Start the agent', run: startFn }],
    })

    it('routes to a matching subcommand', async () => {
      const startFn = vi.fn().mockResolvedValue(undefined)
      await runCLI([agentWithStart(startFn)], ['agent', 'start'], opts)
      expect(startFn).toHaveBeenCalled()
    })

    it('shows command help when no subcommand given', async () => {
      await expect(runCLI([agentWithStart()], ['agent'], opts)).rejects.toThrow('exit:0')
    })

    it('exits 1 for unknown subcommand', async () => {
      await expect(runCLI([agentWithStart()], ['agent', 'unknown'], opts)).rejects.toThrow('exit:1')
    })

    it('shows command help on --help before subcommand', async () => {
      await expect(runCLI([agentWithStart()], ['agent', '--help'], opts)).rejects.toThrow('exit:0')
    })
  })

  describe('run error handling', () => {
    it.each([
      {
        label: 'Error instance',
        thrown: new Error('generation failed'),
        contains: 'generation failed',
      },
      {
        label: 'non-Error value',
        thrown: 'fatal string error',
        contains: 'fatal string error',
      },
    ])('prints message and exits 1 when command throws $label', async ({ thrown, contains }) => {
      const cmd: CommandDefinition = {
        name: 'generate',
        description: 'Generate',
        run: async () => {
          throw thrown
        },
      }
      await expect(runCLI([cmd], ['generate'], opts)).rejects.toThrow('exit:1')
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining(contains))
    })
  })

  describe('buildParseOptions (via run)', () => {
    it('handles options without a short alias', async () => {
      const runFn = vi.fn().mockResolvedValue(undefined)
      const cmd: CommandDefinition = {
        name: 'generate',
        description: 'Generate',
        options: { output: { type: 'string', description: 'Output dir' } },
        run: runFn,
      }
      await runCLI([cmd], ['generate', '--output', 'dist'], opts)
      expect(runFn).toHaveBeenCalledWith(
        expect.objectContaining({
          values: expect.objectContaining({ output: 'dist' }),
        }),
      )
    })

    it('forwards option default values to parseArgs', async () => {
      const runFn = vi.fn().mockResolvedValue(undefined)
      const cmd: CommandDefinition = {
        name: 'generate',
        description: 'Generate',
        options: {
          watch: { type: 'boolean', description: 'Watch', default: false },
        },
        run: runFn,
      }
      await runCLI([cmd], ['generate'], opts)
      expect(runFn).toHaveBeenCalledWith(
        expect.objectContaining({
          values: expect.objectContaining({ watch: false }),
        }),
      )
    })
  })
})
