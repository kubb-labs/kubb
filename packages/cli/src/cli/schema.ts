import type { CommandDefinition, CommandSchema, OptionDefinition, OptionSchema } from './types.ts'

/**
 * Serialize a list of `CommandDefinition` objects into a plain JSON-serializable
 * schema that can be:
 *  - embedded in LLM system prompts
 *  - used to auto-generate MCP tool definitions
 *  - exposed by the agent server to describe available CLI capabilities
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
