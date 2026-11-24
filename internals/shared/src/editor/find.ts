import type { ExtensionKind } from '@kubb/core'
import type { ValueOf } from '@internals/utils'
import {
  type AssignmentExpression,
  type BindingProperty,
  type CallExpression,
  type Comment,
  type Expression,
  type ImportDeclaration,
  type ObjectExpression,
  type ObjectPropertyKind,
  type Program,
  type RestElement,
  type SpreadElement,
  type VariableDeclaration,
  commentTypes,
  nodeTypes,
  parseSource,
  propertyKinds,
  unaryOperators,
} from './ast.ts'
import { isSafeKey } from './rules.ts'
import { getPosition, quotes, type Quote } from './text.ts'
import { type ConfigRef, extensionKinds, type OptionValue } from './types.ts'

/** The marker `disable-plugin` writes, with the block's line count so `enable-plugin` restores exactly those lines. */
const DISABLED_MARKER_PATTERN = /^kubb:disabled (.+)\s+(\d+)$/

/** Identifiers the editor matches by name. */
const identifiers = { defineConfig: 'defineConfig', require: 'require', module: 'module', exports: 'exports' } as const

export const moduleKinds = { esm: 'esm', cjs: 'cjs' } as const
type ModuleKind = ValueOf<typeof moduleKinds>

export type ParsedConfig = { program: Program; comments: ReadonlyArray<Comment>; configs: Array<ObjectExpression>; kind: ModuleKind }
type ValueNode = Expression | SpreadElement | null | undefined
type Import = { from: string; exported: string }
export type FactoryCall = { importName: string; exportName: string; packageName: string; call: CallExpression }
type DisabledBlock = { packageName: string; line: number; end: number; code: Array<string> }

// Finding the config

/** Steps through `as`/`satisfies` and `() => ...` wrappers to the config object. */
function unwrapValue(node: ValueNode): ValueNode {
  if (!node) return undefined
  if (node.type === nodeTypes.tSAsExpression || node.type === nodeTypes.tSSatisfiesExpression) return unwrapValue(node.expression)
  if (node.type !== nodeTypes.arrowFunctionExpression && node.type !== nodeTypes.functionExpression) return node
  if (node.body?.type !== nodeTypes.blockStatement) return unwrapValue(node.body as Expression | null)

  const returned = node.body.body.find((statement) => statement.type === nodeTypes.returnStatement)
  return unwrapValue(returned?.type === nodeTypes.returnStatement ? returned.argument : undefined)
}

function isModuleExports(node: AssignmentExpression['left']): boolean {
  return (
    node.type === nodeTypes.memberExpression &&
    !node.computed &&
    node.object.type === nodeTypes.identifier &&
    node.object.name === identifiers.module &&
    node.property.type === nodeTypes.identifier &&
    node.property.name === identifiers.exports
  )
}

/** The exported config value and how the file exports it. */
function findExport(program: Program): { exported: ValueNode; kind: ModuleKind } {
  for (const node of program.body) {
    if (node.type === nodeTypes.exportDefaultDeclaration) {
      // A `function` or `class` declaration is never a `defineConfig(...)` call, so `findConfigs` refuses it.
      return { exported: node.declaration as Expression, kind: moduleKinds.esm }
    }
    if (node.type === nodeTypes.expressionStatement && node.expression.type === nodeTypes.assignmentExpression && isModuleExports(node.expression.left)) {
      return { exported: node.expression.right, kind: moduleKinds.cjs }
    }
  }
  return { exported: undefined, kind: moduleKinds.esm }
}

/** Every config object in `export default` or `module.exports = defineConfig(...)`, or why the file is unmanaged. */
export function findConfigs(source: string): ParsedConfig | { reason: string } {
  const parsed = parseSource(source)
  if ('reason' in parsed) return parsed

  const { exported, kind } = findExport(parsed.program)
  const value = unwrapValue(exported)
  if (!value) return { reason: 'no `export default` or `module.exports` found' }
  if (value.type !== nodeTypes.callExpression || value.callee.type !== nodeTypes.identifier || value.callee.name !== identifiers.defineConfig) {
    return { reason: 'the exported config is not a defineConfig(...) call' }
  }

  const argument = unwrapValue(value.arguments[0])
  if (!argument) return { reason: 'defineConfig(...) was called without a config' }

  const entries = argument.type === nodeTypes.arrayExpression ? argument.elements.map((element) => unwrapValue(element)) : [argument]
  const configs = entries.filter((entry): entry is ObjectExpression => entry?.type === nodeTypes.objectExpression)
  if (configs.length !== entries.length) return { reason: 'config is not an object literal' }

  return { ...parsed, configs, kind }
}

export function findConfigEntry(configs: Array<ObjectExpression>, ref: ConfigRef | undefined): ObjectExpression | undefined {
  return typeof ref === 'string' ? configs.find((entry) => getConfigName(entry) === ref) : configs[ref ?? 0]
}

export function getOutput(config: ObjectExpression): { object: ObjectExpression } | { reason: string } {
  const found = findProperty(config, 'output')
  if (found?.member.type !== nodeTypes.property || found.member.value.type !== nodeTypes.objectExpression) return { reason: 'output is not an object literal' }
  if (isOverridden(config, found.index)) return { reason: 'a spread after output could override it' }
  return { object: found.member.value }
}

// Reading object literals

export function getKey(entry: ObjectPropertyKind | BindingProperty | RestElement): string | undefined {
  if (entry.type !== nodeTypes.property || entry.computed) return undefined
  if (entry.key.type === nodeTypes.identifier) return entry.key.name
  return entry.key.type === nodeTypes.literal && typeof entry.key.value === 'string' ? entry.key.value : undefined
}

/** The last one wins when the key repeats, as at runtime. */
export function findProperty(node: ObjectExpression, key: string): { member: ObjectPropertyKind; index: number } | undefined {
  const index = node.properties.findLastIndex((entry) => getKey(entry) === key)
  return index === -1 ? undefined : { member: node.properties[index]!, index }
}

export function getValue(node: ObjectExpression, key: string): ValueNode {
  const member = findProperty(node, key)?.member
  return member?.type === nodeTypes.property ? member.value : member
}

export function getConfigName(config: ObjectExpression): string | undefined {
  const name = getValue(config, 'name')
  return name?.type === nodeTypes.literal && typeof name.value === 'string' ? name.value : undefined
}

export function isOverridden(node: ObjectExpression, index: number): boolean {
  return node.properties.slice(index + 1).some((entry) => entry.type === nodeTypes.spreadElement)
}

/** `key: value`, not a method, getter, setter, or `{ key }` shorthand. */
export function isPlainProperty(member: Extract<ObjectPropertyKind, { type: typeof nodeTypes.property }>): boolean {
  return !member.method && !member.shorthand && member.kind === propertyKinds.init
}

/** A literal's value, `undefined` for code. */
export function readLiteral(node: ValueNode): OptionValue | undefined {
  switch (node?.type) {
    case nodeTypes.literal:
      // A bigint or a regex is code, not a value JSON can carry. A regex Node cannot compile also has a `null` value.
      return 'regex' in node || 'bigint' in node ? undefined : (node.value as OptionValue)
    case nodeTypes.templateLiteral:
      return node.expressions.length ? undefined : (node.quasis[0]?.value.cooked ?? '')
    case nodeTypes.unaryExpression: {
      const value = readLiteral(node.argument)
      if (typeof value !== 'number') return undefined
      if (node.operator === unaryOperators.minus) return -value
      if (node.operator === unaryOperators.plus) return value
      return undefined
    }
    case nodeTypes.arrayExpression: {
      const values = node.elements.map((element) => readLiteral(element))
      return values.every((value) => value !== undefined) ? values : undefined
    }
    case nodeTypes.objectExpression: {
      const entries: Record<string, OptionValue> = {}
      for (const entry of node.properties) {
        if (entry.type !== nodeTypes.property) return undefined
        const key = getKey(entry)
        const value = readLiteral(entry.value)
        // A `__proto__` key would replace the object's prototype instead of adding an entry.
        if (key === undefined || !isSafeKey(key) || value === undefined) return undefined
        entries[key] = value
      }
      return entries
    }
  }
  return undefined
}

// Imports and factory calls

function getRequirePath(node: ValueNode): string | undefined {
  if (node?.type !== nodeTypes.callExpression || node.callee.type !== nodeTypes.identifier || node.callee.name !== identifiers.require) return undefined
  const [argument] = node.arguments
  return argument?.type === nodeTypes.literal && typeof argument.value === 'string' ? argument.value : undefined
}

/** `import { exported as local } from '...'`. A default or namespace import has no exported name, so its local name stands in. */
export function importBindings(statement: ImportDeclaration): Array<[string, Import]> {
  return statement.specifiers.map((specifier) => {
    const imported = specifier.type === nodeTypes.importSpecifier ? specifier.imported : specifier.local
    const exported = imported.type === nodeTypes.identifier ? imported.name : imported.value
    return [specifier.local.name, { from: statement.source.value, exported }]
  })
}

/** `const { exported: local } = require('...')`. */
export function requireBindings(statement: VariableDeclaration): Array<[string, Import]> {
  return statement.declarations.flatMap((declarator): Array<[string, Import]> => {
    const from = getRequirePath(declarator.init)
    if (from === undefined || declarator.id.type !== nodeTypes.objectPattern) return []

    return declarator.id.properties.flatMap((entry): Array<[string, Import]> => {
      if (entry.type !== nodeTypes.property || entry.value.type !== nodeTypes.identifier) return []
      return [[entry.value.name, { from, exported: getKey(entry) ?? entry.value.name }]]
    })
  })
}

export function getImports(program: Program): Map<string, Import> {
  return new Map(
    program.body.flatMap((statement) => {
      if (statement.type === nodeTypes.importDeclaration) return importBindings(statement)
      if (statement.type === nodeTypes.variableDeclaration) return requireBindings(statement)
      return []
    }),
  )
}

export function isImportStatement(node: Program['body'][number], kind: ModuleKind): boolean {
  if (kind === moduleKinds.esm) return node.type === nodeTypes.importDeclaration
  return node.type === nodeTypes.variableDeclaration && node.declarations.some((declarator) => getRequirePath(declarator.init) !== undefined)
}

/** The quote of the first string literal in the file, so new code matches it. */
export function detectQuote(node: unknown): Quote | undefined {
  if (!node || typeof node !== 'object') return undefined
  const { type, raw } = node as { type?: string; raw?: unknown }
  if (type === nodeTypes.literal && typeof raw === 'string' && (raw[0] === quotes.single || raw[0] === quotes.double)) return raw[0]
  for (const child of Object.values(node)) {
    const quote = detectQuote(child)
    if (quote) return quote
  }
  return undefined
}

/** The `adapter` value, or the elements of the `plugins` or `parsers` array. */
function factoryNodes(config: ObjectExpression, kind: ExtensionKind): Array<ValueNode> {
  if (kind === extensionKinds.adapter) return [getValue(config, 'adapter')]
  const array = getValue(config, `${kind}s`)
  return array?.type === nodeTypes.arrayExpression ? array.elements : []
}

/** The factory calls of one kind whose callee the file imports. */
export function findCalls(program: Program, config: ObjectExpression, kind: ExtensionKind = extensionKinds.plugin): Array<FactoryCall> {
  const imports = getImports(program)
  return factoryNodes(config, kind).flatMap((node) => {
    if (node?.type !== nodeTypes.callExpression || node.callee.type !== nodeTypes.identifier) return []
    const imported = imports.get(node.callee.name)
    return imported ? [{ importName: node.callee.name, exportName: imported.exported, packageName: imported.from, call: node }] : []
  })
}

// Disabled plugins

/** Whether nothing but whitespace precedes `offset` on its line. */
function startsLine(source: string, offset: number): boolean {
  return source.slice(source.lastIndexOf('\n', offset - 1) + 1, offset).trim() === ''
}

/** The `disable-plugin` blocks in this config, read from marker comments since the call is no longer a node. */
export function findDisabled(source: string, comments: ReadonlyArray<Comment>, config: ObjectExpression): Array<DisabledBlock> {
  const lines = source.split('\n')

  return comments.flatMap((comment) => {
    const match = comment.type === commentTypes.line ? comment.value.trim().match(DISABLED_MARKER_PATTERN) : null
    // Only markers inside this entry, on a line of their own, so another entry or a trailing comment never matches.
    if (!match || comment.start < config.start || comment.end > config.end || !startsLine(source, comment.start)) return []

    const line = getPosition(source, comment.start).line
    const end = line + Number(match[2])
    const code = lines.slice(line, end).map((text) => text.replace(/^(\s*)\/\/ ?/, '$1').replace(/^\s+$/, ''))
    return [{ packageName: match[1]!, line, end, code }]
  })
}
