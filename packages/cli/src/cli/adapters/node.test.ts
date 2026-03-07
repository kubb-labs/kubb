import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CommandDefinition, RunOptions } from '../types.ts'
import { nodeAdapter } from './node.ts'

const opts: RunOptions = { programName: 'kubb', defaultCommandName: 'generate', version: '2.0.0' }

function makeCmd(name: string, run?: (args: { values: Record<string, unknown>; positionals: string[] }) => Promise<void>): CommandDefinition {
  return {
    name,
    description: `${name} command`,
    options: { config: { type: 'string', description: 'Config', short: 'c' } },
    run,
  }
}

describe('nodeAdapter', () => {
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
    it('prints version and exits 0 on --version', async () => {
      await expect(nodeAdapter.run([], ['--version'], opts)).rejects.toThrow('exit:0')
      expect(consoleSpy).toHaveBeenCalledWith('2.0.0')
    })

    it('prints version and exits 0 on -v', async () => {
      await expect(nodeAdapter.run([], ['-v'], opts)).rejects.toThrow('exit:0')
      expect(consoleSpy).toHaveBeenCalledWith('2.0.0')
    })
  })

  describe('--help / -h', () => {
    it('prints root help and exits 0 on --help', async () => {
      await expect(nodeAdapter.run([makeCmd('generate')], ['--help'], opts)).rejects.toThrow('exit:0')
      expect(logOutput()).toContain('generate')
    })

    it('prints root help and exits 0 on -h', async () => {
      await expect(nodeAdapter.run([makeCmd('generate')], ['-h'], opts)).rejects.toThrow('exit:0')
    })
  })

  describe('argv stripping', () => {
    it('strips leading node/script entries when argv[0] includes "node"', async () => {
      const runFn = vi.fn().mockResolvedValue(undefined)
      await nodeAdapter.run([makeCmd('generate', runFn)], ['/usr/bin/node', 'kubb.js', 'generate'], opts)
      expect(runFn).toHaveBeenCalled()
    })

    it('does not strip when argv[0] does not include "node"', async () => {
      const runFn = vi.fn().mockResolvedValue(undefined)
      await nodeAdapter.run([makeCmd('generate', runFn)], ['generate'], opts)
      expect(runFn).toHaveBeenCalled()
    })
  })

  describe('empty args', () => {
    it('runs default command when no args provided', async () => {
      const runFn = vi.fn().mockResolvedValue(undefined)
      await nodeAdapter.run([makeCmd('generate', runFn)], [], opts)
      expect(runFn).toHaveBeenCalledWith({ values: {}, positionals: [] })
    })

    it('shows root help when default command has no run', async () => {
      await nodeAdapter.run([makeCmd('generate')], [], opts)
      expect(logOutput()).toContain('kubb')
    })
  })

  describe('known command routing', () => {
    it('runs a known command', async () => {
      const runFn = vi.fn().mockResolvedValue(undefined)
      await nodeAdapter.run([makeCmd('generate', runFn)], ['generate'], opts)
      expect(runFn).toHaveBeenCalled()
    })

    it('routes unrecognised first arg to default command', async () => {
      const runFn = vi.fn().mockResolvedValue(undefined)
      await nodeAdapter.run([makeCmd('generate', runFn)], ['--config', 'kubb.config.ts'], opts)
      expect(runFn).toHaveBeenCalled()
    })

    it('passes flags as values to the command', async () => {
      const runFn = vi.fn().mockResolvedValue(undefined)
      await nodeAdapter.run([makeCmd('generate', runFn)], ['generate', '--config', 'my.config.ts'], opts)
      expect(runFn).toHaveBeenCalledWith(expect.objectContaining({ values: expect.objectContaining({ config: 'my.config.ts' }) }))
    })

    it('shows command help on --help flag', async () => {
      await expect(nodeAdapter.run([makeCmd('generate')], ['generate', '--help'], opts)).rejects.toThrow('exit:0')
    })
  })

  describe('unknown top-level command', () => {
    it('prints error and exits 1 when no matching command found', async () => {
      const cmd = makeCmd('validate')
      // 'unknowncmd' is not known, and defaultCommandName 'generate' is not in list
      await expect(nodeAdapter.run([cmd], ['unknowncmd'], opts)).rejects.toThrow('exit:1')
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('unknowncmd'))
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
      await nodeAdapter.run([agentWithStart(startFn)], ['agent', 'start'], opts)
      expect(startFn).toHaveBeenCalled()
    })

    it('shows command help when no subcommand given', async () => {
      await expect(nodeAdapter.run([agentWithStart()], ['agent'], opts)).rejects.toThrow('exit:0')
    })

    it('exits 1 for unknown subcommand', async () => {
      await expect(nodeAdapter.run([agentWithStart()], ['agent', 'unknown'], opts)).rejects.toThrow('exit:1')
    })

    it('shows command help on --help before subcommand', async () => {
      await expect(nodeAdapter.run([agentWithStart()], ['agent', '--help'], opts)).rejects.toThrow('exit:0')
    })
  })

  describe('run error handling', () => {
    it('prints error message and exits 1 when command run throws', async () => {
      const cmd: CommandDefinition = {
        name: 'generate',
        description: 'Generate',
        run: async () => {
          throw new Error('generation failed')
        },
      }
      await expect(nodeAdapter.run([cmd], ['generate'], opts)).rejects.toThrow('exit:1')
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('generation failed'))
    })
  })

  describe('renderHelp', () => {
    it('delegates to help.ts renderHelp', () => {
      const cmd = makeCmd('generate')
      nodeAdapter.renderHelp(cmd, 'kubb')
      expect(logOutput()).toContain('generate')
    })
  })
})
