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
    if (key !== 'schema' || typeof value !== 'object' || value === null || !isRef(this)) return value
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
  const refs: Array<{ schema: unknown }> = []
  const document = JSON.parse(text, function (this: unknown, key: string, value: unknown) {
    if (key === 'schema' && typeof value === 'number' && isRef(this)) refs.push(this)
    return value
  }) as Partial<JsonDocument> | null

  if (document?.version !== version || !document.input || !Array.isArray(document.targets)) {
    throw new Error(`Cannot read this AST JSON: expected format version ${version}, got ${JSON.stringify(document?.version)}.`)
  }

  for (const ref of refs) {
    const target = document.targets[ref.schema as number]
    if (!target) throw new Error(`Cannot read this AST JSON: a ref points at target ${ref.schema}, which is missing.`)
    ref.schema = target
  }

  return document.input
}
