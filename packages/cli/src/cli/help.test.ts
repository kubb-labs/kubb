import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CommandDefinition } from './types.ts'
import { renderHelp } from './help.ts'

describe('renderHelp', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  function output(): string {
    return consoleSpy.mock.calls.flat().join('\n')
  }

  it('includes command name in usage line', () => {
    renderHelp({ name: 'generate', description: 'Generate code' })
    expect(output()).toContain('generate')
  })

  it('includes parentName prefix in usage line', () => {
    renderHelp({ name: 'start', description: 'Start agent' }, 'kubb agent')
    expect(output()).toContain('kubb agent start')
  })

  it('prints command description', () => {
    renderHelp({ name: 'generate', description: 'Generates client code from OpenAPI' })
    expect(output()).toContain('Generates client code from OpenAPI')
  })

  it('always includes --help option', () => {
    renderHelp({ name: 'test', description: 'Test' })
    expect(output()).toContain('--help')
  })

  it('prints option name and description', () => {
    const def: CommandDefinition = {
      name: 'generate',
      description: 'Generate',
      options: {
        config: { type: 'string', short: 'c', description: 'Config path' },
      },
    }
    renderHelp(def)
    expect(output()).toContain('--config')
    expect(output()).toContain('Config path')
  })

  it('shows option default value', () => {
    const def: CommandDefinition = {
      name: 'serve',
      description: 'Serve',
      options: { port: { type: 'string', description: 'Port', default: '3000' } },
    }
    renderHelp(def)
    expect(output()).toContain('3000')
  })

  it('prints subcommands section', () => {
    const def: CommandDefinition = {
      name: 'agent',
      description: 'Agent',
      subCommands: [{ name: 'start', description: 'Start the agent' }],
    }
    renderHelp(def)
    expect(output()).toContain('start')
    expect(output()).toContain('Start the agent')
  })

  it('adds <command> to usage line when subCommands exist', () => {
    const def: CommandDefinition = {
      name: 'agent',
      description: 'Agent commands',
      subCommands: [{ name: 'start', description: 'Start' }],
    }
    renderHelp(def)
    expect(output()).toContain('<command>')
  })

  it('adds positional argument labels to usage line', () => {
    const def: CommandDefinition = {
      name: 'run',
      description: 'Run a file',
      arguments: ['[input]'],
    }
    renderHelp(def)
    expect(output()).toContain('[input]')
  })

  it('omits the description block when description is empty', () => {
    renderHelp({ name: 'group', description: '' })
    expect(output()).toContain('group')
    expect(output()).toContain('--help')
  })
})
