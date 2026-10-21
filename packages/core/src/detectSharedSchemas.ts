import { resolve } from 'node:path'
import { collectImportedRefNames, type InputNode, type SchemaNode } from '@kubb/ast'
import type { Adapter } from './createAdapter.ts'
import type { SharedOutput } from './definePlugin.ts'
import { Diagnostics } from './Diagnostics.ts'
import { inputToAdapterSource } from './input.ts'
import type { Config } from './types.ts'

type Member = { config: Config; adapter: Adapter; shared: SharedOutput }

type Detected = {
  configs: Array<Config>
  conflicts: Array<string>
  /**
   * The parsed spec of every config that was compared, keyed by the returned config, so the build does not parse it again.
   */
  inputs: Map<Config, InputNode>
}

// Skips the target a ref embeds, so recursive schemas serialize and only the ref itself is compared.
function toShape(node: SchemaNode): string {
  return JSON.stringify(node, function (key, value) {
    return key === 'schema' && this.type === 'ref' ? undefined : value
  })
}

// Reports a spec that fails to parse the way the build does, so a caller can tell it from a bug in detection.
async function parse({ config, adapter }: Member): Promise<InputNode> {
  try {
    return await adapter.parse(inputToAdapterSource(config))
  } catch (caughtError) {
    throw new Diagnostics.Error(Diagnostics.fromExtension(caughtError, { kind: 'adapter', extension: adapter }))
  }
}

/**
 * Fills `output.shared.schemas` on every config that sets `output.shared`. Configs with the same shared path share every schema
 * they all define identically, as long as the schemas it references are shared too. `conflicts` lists the names
 * they all define, but differently, which stay in each config's own output.
 */
export async function detectSharedSchemas(configs: Array<Config>): Promise<Detected> {
  const groups = new Map<string, Array<Member>>()
  for (const config of configs) {
    const { shared } = config.output
    const { adapter } = config
    if (!shared || !adapter) continue

    const key = resolve(config.root, shared.path)
    groups.set(key, [...(groups.get(key) ?? []), { config, adapter, shared }])
  }

  const detected = new Map<Config, { shared: SharedOutput; input: InputNode }>()
  const conflicts = new Set<string>()
  for (const group of groups.values()) {
    if (group.length < 2) continue

    const parsed: Array<{ member: Member; input: InputNode; schemas: Map<string, SchemaNode> }> = []
    // Sequential, since configs may share one adapter instance.
    for (const member of group) {
      const input = await parse(member)
      parsed.push({ member, input, schemas: new Map(input.schemas.flatMap((node) => (node.name ? [[node.name, node] as const] : []))) })
    }

    const [first, ...rest] = parsed
    if (!first) continue
    const names = new Set<string>()
    for (const [name, node] of first.schemas) {
      const others = rest.flatMap(({ schemas }) => schemas.get(name) ?? [])
      if (others.length < rest.length) continue

      const shape = toShape(node)
      const bucket = others.every((other) => toShape(other) === shape) ? names : conflicts
      bucket.add(name)
    }

    // A shared file imports its refs from the shared directory, so drop schemas until every ref is shared.
    let changed = true
    while (changed) {
      changed = false
      for (const [name, node] of first.schemas) {
        if (!names.has(name) || collectImportedRefNames(node).every((ref) => names.has(ref))) continue
        names.delete(name)
        changed = true
      }
    }

    for (const { member, input } of parsed) detected.set(member.config, { shared: { ...member.shared, schemas: [...names] }, input })
  }

  const inputs = new Map<Config, InputNode>()
  const result = configs.map((config) => {
    const entry = detected.get(config)
    if (!entry) return config

    const next = { ...config, output: { ...config.output, shared: entry.shared } }
    inputs.set(next, entry.input)
    return next
  })

  return { configs: result, conflicts: [...conflicts], inputs }
}
