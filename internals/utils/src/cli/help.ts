import { styleText } from 'node:util'
import { getCommandSchema } from './schema.ts'
import type { CommandDefinition, OptionSchema } from './types.ts'

/** Prints formatted help output for `def` using its `CommandDefinition`.
 *
 * @example
 * ```ts
 * renderHelp({ name: 'generate', description: 'Generate client code' })
 * // prints Usage: generate [options] ...
 * ```
 */
export function renderHelp(def: CommandDefinition, parentName?: string): void {
  const schema = getCommandSchema([def])[0]!

  const programName = parentName ? `${parentName} ${schema.name}` : schema.name

  const argsPart = schema.arguments?.length ? ` ${schema.arguments.join(' ')}` : ''
  const subCmdPart = schema.subCommands.length ? ' <command>' : ''
  console.log(`\n${styleText('bold', 'Usage:')} ${programName}${argsPart}${subCmdPart} [options]\n`)

  if (schema.description) {
    console.log(`  ${schema.description}\n`)
  }

  if (schema.subCommands.length) {
    console.log(styleText('bold', 'Commands:'))
    for (const sub of schema.subCommands) {
      console.log(`  ${styleText('cyan', sub.name.padEnd(16))}${sub.description}`)
    }
    console.log()
  }

  const options: OptionSchema[] = [
    ...schema.options,
    {
      name: 'help',
      flags: '-h, --help',
      type: 'boolean' as const,
      description: 'Show help',
    },
  ]

  console.log(styleText('bold', 'Options:'))
  for (const opt of options) {
    const flags = styleText('cyan', opt.flags.padEnd(30))
    const defaultPart = opt.default !== undefined ? styleText('dim', ` (default: ${opt.default})`) : ''
    console.log(`  ${flags}${opt.description}${defaultPart}`)
  }
  console.log()
}
