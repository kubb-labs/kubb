import { describe, expect, it } from 'vitest'
import type { OptionDefinition } from './types.ts'
import { getCommandSchema } from './schema.ts'

function schemaOpt(option: OptionDefinition) {
  const [schema] = getCommandSchema([{ name: 'cmd', description: 'Cmd', options: { opt: option } }])
  return schema?.options[0]
}

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

  describe('option flags', () => {
    it.each([
      { option: { type: 'boolean' as const, description: 'Watch' }, expected: '--opt' },
      { option: { type: 'string' as const, description: 'Config' }, expected: '--opt <opt>' },
      { option: { type: 'string' as const, description: 'Config', hint: 'path' }, expected: '--opt <path>' },
      { option: { type: 'string' as const, description: 'Config', short: 'c' }, expected: '-c, --opt <opt>' },
    ])('builds flags "$expected" for $option.type option', ({ option, expected }) => {
      expect(schemaOpt(option)?.flags).toBe(expected)
    })
  })

  describe('option fields', () => {
    it.each([
      { option: { type: 'string' as const, description: 'Port', default: '3000' }, field: 'default', expected: '3000' },
      { option: { type: 'string' as const, description: 'Config', hint: 'path' }, field: 'hint', expected: 'path' },
      { option: { type: 'string' as const, description: 'Level', enum: ['info', 'debug'] }, field: 'enum', expected: ['info', 'debug'] },
      { option: { type: 'string' as const, description: 'Config', required: true }, field: 'required', expected: true },
    ])('includes $field when set', ({ option, field, expected }) => {
      expect(schemaOpt(option)?.[field as keyof ReturnType<typeof schemaOpt>]).toEqual(expected)
    })

    it('omits default when not set', () => {
      expect(schemaOpt({ type: 'string', description: 'Config' })).not.toHaveProperty('default')
    })
  })

  it('serializes nested subCommands recursively', () => {
    const [schema] = getCommandSchema([
      {
        name: 'agent',
        description: 'Agent',
        subCommands: [
          { name: 'start', description: 'Start agent', options: { port: { type: 'string', description: 'Port' } } },
        ],
      },
    ])
    const sub = schema?.subCommands[0]
    expect(sub?.name).toBe('start')
    expect(sub?.options[0]?.name).toBe('port')
  })
})
