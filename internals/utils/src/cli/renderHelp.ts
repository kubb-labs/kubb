import { styleText } from 'node:util'
import type { CommandDefinition, OptionDefinition } from './defineCommand.ts'

function formatFlags(name: string, opt: OptionDefinition): string {
  const short = opt.short ? `-${opt.short}, ` : ''
  const value = opt.type === 'string' ? ` <${opt.hint ?? name}>` : ''
  return `${short}--${name}${value}`
}

/** Prints formatted help output for `def` using its `CommandDefinition`.
 *
 * @example
 * ```ts
 * renderHelp({ name: 'generate', description: 'Generate client code' })
 * // prints Usage: generate [options] ...
 * ```
 */
export function renderHelp(def: CommandDefinition, parentName?: string): void {
  const programName = parentName ? `${parentName} ${def.name}` : def.name
  const subCommands = def.subCommands ?? []

  const argsPart = def.arguments?.length ? ` ${def.arguments.join(' ')}` : ''
  const subCmdPart = subCommands.length ? ' <command>' : ''
  console.log(`\n${styleText('bold', 'Usage:')} ${programName}${argsPart}${subCmdPart} [options]\n`)

  if (def.description) {
    console.log(`  ${def.description}\n`)
  }

  if (subCommands.length) {
    console.log(styleText('bold', 'Commands:'))
    for (const sub of subCommands) {
      console.log(`  ${styleText('cyan', sub.name.padEnd(16))}${sub.description}`)
    }
    console.log()
  }

  const options: Array<{ flags: string; description: string; default?: string | boolean }> = [
    ...Object.entries(def.options ?? {}).map(([name, opt]) => ({ flags: formatFlags(name, opt), description: opt.description, default: opt.default })),
    { flags: '-h, --help', description: 'Show help' },
  ]

  console.log(styleText('bold', 'Options:'))
  for (const opt of options) {
    const flags = styleText('cyan', opt.flags.padEnd(30))
    const defaultPart = opt.default !== undefined ? styleText('dim', ` (default: ${opt.default})`) : ''
    console.log(`  ${flags}${opt.description}${defaultPart}`)
  }
  console.log()

  if (def.examples?.length) {
    console.log(styleText('bold', 'Examples:'))
    for (const ex of def.examples) {
      console.log(`  ${styleText('dim', ex)}`)
    }
    console.log()
  }
}
