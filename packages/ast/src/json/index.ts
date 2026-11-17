import { nodeKinds, schemaTypes } from '../constants.ts'
import type { InputNode } from '../nodes/input.ts'
import type { SchemaNode } from '../nodes/schema.ts'

const version = 1

type JsonDocument = {
  version: number
  input: InputNode
  targets: Array<SchemaNode>
}

function isRef(value: unknown): value is { schema: unknown } {
  const node = value as { kind?: unknown; type?: unknown } | null
  return node?.kind === nodeKinds.schema && node.type === schemaTypes.ref
}

/**
 * Turns an `InputNode` into JSON text that `parse` reads back. Every schema a ref points at is written once,
 * where a plain `JSON.stringify(input)` writes it again at every ref.
 *
 * @example
 * ```ts
 * await writeFile('input.json', ast.json.stringify(input))
 * ```
 */
export function stringify(input: InputNode): string {
  const ids = new Map<unknown, number>()
  const targets: Array<unknown> = []

  function replacer(this: unknown, key: string, value: unknown): unknown {
    if (key !== 'schema' || !isRef(this)) return value
    // Spec data such as a `default` can look like a ref node. Its number is wrapped, so `parse` does not read it as a target.
    if (typeof value === 'number') return [value]
    if (typeof value !== 'object' || value === null) return value
    if (!ids.has(value)) {
      ids.set(value, targets.length)
      targets.push(value)
    }
    return ids.get(value)
  }

  const root = JSON.stringify(input, replacer)
  const encoded: Array<string> = []
  // A target can hold refs to targets not seen yet, so the list grows while this loop reads it.
  for (const target of targets) encoded.push(JSON.stringify(target, replacer))

  return `{"version":${version},"input":${root},"targets":[${encoded.join(',')}]}`
}

/**
 * Reads the text `stringify` wrote back into an `InputNode`. Refs to one schema share one object again.
 * Throws on another format version, or on a ref whose target is missing.
 */
export function parse(text: string): InputNode {
  // Plain `JSON.parse` and one loop over the tree: a reviver made this about 5 times slower on a large spec.
  const document = JSON.parse(text) as Partial<JsonDocument> | null

  if (document?.version !== version) {
    throw new Error(`Cannot read this AST JSON: expected format version ${version}, got ${JSON.stringify(document?.version)}.`)
  }
  if (!document.input || !Array.isArray(document.targets)) {
    throw new Error('Cannot read this AST JSON: `input` or `targets` is missing.')
  }

  const targets = document.targets
  const stack: Array<unknown> = [document.input, ...targets]
  while (stack.length) {
    const value = stack.pop() as Record<string, unknown>
    const ref = isRef(value)
    for (const key in value) {
      const child = value[key]
      if (ref && key === 'schema') {
        if (Array.isArray(child)) {
          value.schema = child[0]
          continue
        }
        if (typeof child === 'number') {
          const target = targets[child]
          if (!target) throw new Error(`Cannot read this AST JSON: a ref points at target ${child}, which is missing.`)
          value.schema = target
          continue
        }
      }
      if (typeof child === 'object' && child !== null) stack.push(child)
    }
  }

  return document.input
}
