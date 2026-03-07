import type { CommandDefinition, CommandSchema, OptionDefinition, OptionSchema } from './types.ts'

/**
 * Serializes `CommandDefinition[]` to a plain, JSON-serializable structure.
 * Use to expose CLI capabilities to AI agents or MCP tools.
 */
export function getCommandSchema(defs: CommandDefinition[]): CommandSchema[] {
  return defs.map(serializeCommand)
}

function serializeCommand(def: CommandDefinition): CommandSchema {
  return {
    name: def.name,
    description: def.description,
    arguments: def.arguments,
    options: serializeOptions(def.options ?? {}),
    subCommands: def.subCommands ? def.subCommands.map(serializeCommand) : [],
  }
}

function serializeOptions(options: Record<string, OptionDefinition>): OptionSchema[] {
  return Object.entries(options).map(([name, opt]) => {
    const shortPart = opt.short ? `-${opt.short}, ` : ''
    const valuePart = opt.type === 'string' ? ` <${opt.hint ?? name}>` : ''
    const flags = `${shortPart}--${name}${valuePart}`

    return {
      name,
      flags,
      type: opt.type,
      description: opt.description,
      ...(opt.default !== undefined ? { default: opt.default } : {}),
      ...(opt.hint ? { hint: opt.hint } : {}),
      ...(opt.required ? { required: opt.required } : {}),
    }
  })
}
