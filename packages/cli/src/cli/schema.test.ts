import { describe, expect, it } from 'vitest'
import { getCommandSchema } from './schema.ts'

describe('getCommandSchema', () => {
  it('serializes name and description', () => {
    const [schema] = getCommandSchema([{ name: 'build', description: 'Build the project' }])
    expect(schema?.name).toBe('build')
    expect(schema?.description).toBe('Build the project')
  })

  it('returns empty options and subCommands by default', () => {
    const [schema] = getCommandSchema([{ name: 'build', description: 'Build' }])
    expect(schema?.options).toEqual([])
    expect(schema?.subCommands).toEqual([])
  })

  it('handles multiple commands', () => {
    const schemas = getCommandSchema([
      { name: 'generate', description: 'Generate' },
      { name: 'validate', description: 'Validate' },
    ])
    expect(schemas).toHaveLength(2)
    expect(schemas[0]?.name).toBe('generate')
    expect(schemas[1]?.name).toBe('validate')
  })

  it('serializes boolean option flags', () => {
    const [schema] = getCommandSchema([
      {
        name: 'build',
        description: 'Build',
        options: { watch: { type: 'boolean', description: 'Watch mode' } },
      },
    ])
    const opt = schema?.options[0]
    expect(opt?.name).toBe('watch')
    expect(opt?.flags).toBe('--watch')
    expect(opt?.type).toBe('boolean')
    expect(opt?.description).toBe('Watch mode')
  })

  it('serializes string option with name as fallback value placeholder', () => {
    const [schema] = getCommandSchema([
      {
        name: 'generate',
        description: 'Generate',
        options: { config: { type: 'string', description: 'Config path' } },
      },
    ])
    expect(schema?.options[0]?.flags).toBe('--config <config>')
  })

  it('serializes string option with hint in flags', () => {
    const [schema] = getCommandSchema([
      {
        name: 'generate',
        description: 'Generate',
        options: { config: { type: 'string', description: 'Config path', hint: 'path' } },
      },
    ])
    expect(schema?.options[0]?.flags).toBe('--config <path>')
    expect(schema?.options[0]?.hint).toBe('path')
  })

  it('serializes short option prefix in flags', () => {
    const [schema] = getCommandSchema([
      {
        name: 'generate',
        description: 'Generate',
        options: { config: { type: 'string', short: 'c', description: 'Config' } },
      },
    ])
    expect(schema?.options[0]?.flags).toBe('-c, --config <config>')
  })

  it('includes default value when set', () => {
    const [schema] = getCommandSchema([
      {
        name: 'serve',
        description: 'Serve',
        options: { port: { type: 'string', description: 'Port', default: '3000' } },
      },
    ])
    expect(schema?.options[0]?.default).toBe('3000')
  })

  it('omits default when not set', () => {
    const [schema] = getCommandSchema([
      {
        name: 'generate',
        description: 'Generate',
        options: { config: { type: 'string', description: 'Config' } },
      },
    ])
    expect(schema?.options[0]).not.toHaveProperty('default')
  })

  it('includes enum values', () => {
    const [schema] = getCommandSchema([
      {
        name: 'generate',
        description: 'Generate',
        options: { logLevel: { type: 'string', description: 'Log level', enum: ['info', 'debug', 'silent'] } },
      },
    ])
    expect(schema?.options[0]?.enum).toEqual(['info', 'debug', 'silent'])
  })

  it('includes required flag when set', () => {
    const [schema] = getCommandSchema([
      {
        name: 'generate',
        description: 'Generate',
        options: { config: { type: 'string', description: 'Config', required: true } },
      },
    ])
    expect(schema?.options[0]?.required).toBe(true)
  })

  it('serializes nested subCommands recursively', () => {
    const [schema] = getCommandSchema([
      {
        name: 'agent',
        description: 'Agent',
        subCommands: [
          {
            name: 'start',
            description: 'Start agent',
            options: { port: { type: 'string', description: 'Port' } },
          },
        ],
      },
    ])
    const sub = schema?.subCommands[0]
    expect(sub?.name).toBe('start')
    expect(sub?.description).toBe('Start agent')
    expect(sub?.options[0]?.name).toBe('port')
  })

  it('preserves arguments field', () => {
    const [schema] = getCommandSchema([{ name: 'run', description: 'Run', arguments: ['[input]'] }])
    expect(schema?.arguments).toEqual(['[input]'])
  })
})
