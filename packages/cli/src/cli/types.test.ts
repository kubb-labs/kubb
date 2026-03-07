import { describe, expect, it, vi } from 'vitest'
import type { CLIAdapter } from './types.ts'
import { defineCLIAdapter, defineCommand } from './types.ts'

describe('defineCommand', () => {
  it('returns name and description', () => {
    const cmd = defineCommand({ name: 'test', description: 'A test command' })
    expect(cmd.name).toBe('test')
    expect(cmd.description).toBe('A test command')
  })

  it('has no run when not provided', () => {
    const cmd = defineCommand({ name: 'test', description: 'Test' })
    expect(cmd.run).toBeUndefined()
  })

  it('wraps run callback so values are forwarded', async () => {
    const runFn = vi.fn()
    const cmd = defineCommand({
      name: 'test',
      description: 'Test',
      options: {
        name: { type: 'string', description: 'Name' },
        verbose: { type: 'boolean', description: 'Verbose', default: false },
      },
      run: async ({ values }) => {
        runFn(values.name, values.verbose)
      },
    })
    await cmd.run?.({ values: { name: 'kubb', verbose: true }, positionals: [] })
    expect(runFn).toHaveBeenCalledWith('kubb', true)
  })

  it('passes positionals to run callback', async () => {
    const runFn = vi.fn()
    const cmd = defineCommand({
      name: 'test',
      description: 'Test',
      run: async ({ positionals }) => {
        runFn(positionals)
      },
    })
    await cmd.run?.({ values: {}, positionals: ['file1.ts', 'file2.ts'] })
    expect(runFn).toHaveBeenCalledWith(['file1.ts', 'file2.ts'])
  })

  it('preserves subCommands field', () => {
    const sub = defineCommand({ name: 'sub', description: 'Sub' })
    const cmd = defineCommand({ name: 'parent', description: 'Parent', subCommands: [sub] })
    expect(cmd.subCommands).toEqual([sub])
  })

  it('preserves arguments field', () => {
    const cmd = defineCommand({ name: 'run', description: 'Run', arguments: ['[input]'] })
    expect(cmd.arguments).toEqual(['[input]'])
  })

  it('preserves options field', () => {
    const options = { config: { type: 'string' as const, description: 'Config' } }
    const cmd = defineCommand({ name: 'generate', description: 'Generate', options })
    expect(cmd.options).toEqual(options)
  })
})

describe('defineCLIAdapter', () => {
  it('returns the adapter unchanged', () => {
    const adapter: CLIAdapter = { run: vi.fn(), renderHelp: vi.fn() }
    expect(defineCLIAdapter(adapter)).toBe(adapter)
  })
})
