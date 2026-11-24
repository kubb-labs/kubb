import { type CallExpression, type ObjectExpression, nodeTypes, parseExpression, parseSource } from './ast.ts'
import { isSafeKey, pickOutput, toExportName } from './rules.ts'
import { getPosition } from './text.ts'
import { type ConfigFileView, type ConfigView, extensionKinds, type OptionsView, type OptionValue, type PluginView } from './types.ts'
import type { FactoryCall, ParsedConfig } from './find.ts'
import { findCalls, findConfigs, findDisabled, findProperty, getConfigName, getImports, getKey, getOutput, isOverridden, readLiteral } from './find.ts'

// Reading options

/** Literal members as `value` and code paths as `locked`, `undefined` for a computed key. */
function readEditable(node: ObjectExpression, prefix: Array<string> = []): { value: Record<string, OptionValue>; locked: Array<Array<string>> } | undefined {
  const value: Record<string, OptionValue> = {}
  const locked: Array<Array<string>> = []

  for (const [index, entry] of node.properties.entries()) {
    if (entry.type === nodeTypes.spreadElement) continue
    const key = getKey(entry)
    if (key === undefined) return undefined
    if (findProperty(node, key)?.index !== index) continue

    const path = [...prefix, key]
    // A `__proto__` key replaces the prototype, so it reads as code.
    if (!isSafeKey(key)) {
      locked.push(path)
      continue
    }

    const member = isOverridden(node, index) ? undefined : entry.value
    const literal = readLiteral(member)
    if (literal !== undefined) {
      value[key] = literal
      continue
    }
    if (member?.type !== nodeTypes.objectExpression) {
      locked.push(path)
      continue
    }

    const nested = readEditable(member, path)
    if (!nested) return undefined
    value[key] = nested.value
    locked.push(...nested.locked)
  }
  return { value, locked }
}

function readObjectOptions(options: ObjectExpression): OptionsView {
  const entries: OptionsView = {}
  for (const [index, entry] of options.properties.entries()) {
    const key = getKey(entry)
    if (key === undefined || !isSafeKey(key)) continue

    const member = entry.type === nodeTypes.property && !isOverridden(options, index) ? entry.value : undefined
    const value = readLiteral(member)
    if (value !== undefined) {
      entries[key] = { literal: true, value }
      continue
    }
    entries[key] = { literal: false, ...(member?.type === nodeTypes.objectExpression ? readEditable(member) : undefined) }
  }
  return entries
}

function readCallOptions(call: CallExpression): OptionsView {
  const options = call.arguments[0]
  return options?.type === nodeTypes.objectExpression ? readObjectOptions(options) : {}
}

function readDisabledOptions(code: Array<string>): OptionsView {
  const call = parseExpression(code.join('\n').trim().replace(/,$/, ''))
  return call?.type === nodeTypes.callExpression ? readCallOptions(call) : {}
}

function toPluginView({ importName, packageName, call }: FactoryCall): PluginView {
  return { importName, packageName, options: readCallOptions(call) }
}

/** Active and disabled plugins, in source order so a disabled plugin keeps its place. */
function readPlugins({ source, parsed, config }: { source: string; parsed: ParsedConfig; config: ObjectExpression }): Array<PluginView> {
  const importNames = new Map([...getImports(parsed.program)].map(([local, { from }]) => [from, local]))

  const active = findCalls(parsed.program, config).map((call) => ({ line: getPosition(source, call.call.start).line, plugin: toPluginView(call) }))
  const disabled = findDisabled(source, parsed.comments, config).map(({ packageName, line, code }) => ({
    line,
    plugin: {
      importName: importNames.get(packageName) ?? toExportName(packageName),
      packageName,
      options: readDisabledOptions(code),
      disabled: true as const,
    },
  }))

  return [...active, ...disabled].sort((a, b) => a.line - b.line).map(({ plugin }) => plugin)
}

function readConfigView({ source, parsed, config }: { source: string; parsed: ParsedConfig; config: ObjectExpression }): ConfigView {
  const [adapter] = findCalls(parsed.program, config, extensionKinds.adapter).map(toPluginView)
  const parsers = findCalls(parsed.program, config, extensionKinds.parser).map(toPluginView)
  const output = getOutput(config)

  return {
    name: getConfigName(config),
    plugins: readPlugins({ source, parsed, config }),
    ...(adapter && { adapter }),
    ...(parsers.length ? { parsers } : {}),
    ...(!('reason' in output) && { output: pickOutput(readObjectOptions(output.object)) }),
  }
}

/** Which plugins the file declares and which options Studio may write. */
export function readConfig(source: string): ConfigFileView {
  const parsed = findConfigs(source)
  if ('reason' in parsed) return { managed: false, reason: parsed.reason }

  return { managed: true, configs: parsed.configs.map((config) => readConfigView({ source, parsed, config })) }
}

/** The modules the file imports, empty when it cannot be parsed. */
export function readImports(source: string): Array<string> {
  const parsed = parseSource(source)
  if ('reason' in parsed) return []
  return [...new Set([...getImports(parsed.program).values()].map(({ from }) => from))]
}
