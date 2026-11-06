import { resolve } from 'node:path'
import { collectImportedRefNames, type InputNode, type SchemaNode } from '@kubb/ast'
import type { Adapter } from './createAdapter.ts'
import type { SharedOutput } from './definePlugin.ts'
import { type Diagnostic, Diagnostics } from './Diagnostics.ts'
import { inputToAdapterSource } from './input.ts'
import type { Config } from './types.ts'

type Member = { config: Config; adapter: Adapter; shared: SharedOutput }

/**
 * A spec parsed ahead of its build, with what the adapter reported while parsing it.
 */
export type ParsedInput = { inputNode: InputNode; diagnostics: Array<Diagnostic> }

type Detected = {
  configs: Array<Config>
  conflicts: Array<string>
  /**
   * The parsed spec of every config that was compared, keyed by the returned config, so the build does not parse it again.
   */
  inputs: Map<Config, ParsedInput>
}

// Skips the target a ref embeds, so recursive schemas serialize and only the ref itself is compared.
function toShape(node: SchemaNode): string {
  return JSON.stringify(node, function (key, value) {
    return key === 'schema' && this.type === 'ref' ? undefined : value
  })
}

// Collects what the adapter reports, for the build to report. A spec that fails to parse throws the way the build does, so a caller can tell it from a bug in detection.
async function parse({ config, adapter }: Member): Promise<ParsedInput> {
  const diagnostics: Array<Diagnostic> = []
  try {
    const inputNode = await Diagnostics.scope(
      (diagnostic) => diagnostics.push(diagnostic),
      () => adapter.parse(inputToAdapterSource(config)),
    )
    return { inputNode, diagnostics }
  } catch (caughtError) {
    throw new Diagnostics.Error(Diagnostics.fromExtension(caughtError, { kind: 'adapter', extension: adapter }))
  }
}

/**
 * Fills `output.shared.schemas` on every config that sets `output.shared`. Among configs with the same shared path, a schema
 * is shared by the largest group of two or more configs that define it identically, the first group on a tie. A config
 * shares it only when it also shares every schema it references. Each config lists only the shared schemas it defines.
 * `conflicts` lists the names that configs define differently. A config outside the sharing group keeps its own copy.
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

  const detected = new Map<Config, { shared: SharedOutput; parsed: ParsedInput }>()
  const conflicts = new Set<string>()
  for (const group of groups.values()) {
    if (group.length < 2) continue

    const specs: Array<{ member: Member; parsed: ParsedInput; schemas: Map<string, SchemaNode> }> = []
    // Sequential, since configs may share one adapter instance.
    for (const member of group) {
      const input = await parse(member)
      specs.push({ member, parsed: input, schemas: new Map(input.inputNode.schemas.flatMap((node) => (node.name ? [[node.name, node] as const] : []))) })
    }

    // Each name with the indexes of the configs that share it.
    const shared = new Map<string, Set<number>>()
    for (const name of new Set(specs.flatMap(({ schemas }) => [...schemas.keys()]))) {
      const byShape = new Map<string, Array<number>>()
      specs.forEach(({ schemas }, index) => {
        const node = schemas.get(name)
        if (!node) return
        const shape = toShape(node)
        byShape.set(shape, [...(byShape.get(shape) ?? []), index])
      })
      if (byShape.size > 1) conflicts.add(name)

      const largest = [...byShape.values()].reduce((best, next) => (next.length > best.length ? next : best))
      if (largest.length >= 2) shared.set(name, new Set(largest))
    }

    // A shared file imports its refs from the shared directory, so drop a config from a schema until it shares every ref too.
    let changed = true
    while (changed) {
      changed = false
      for (const [name, members] of shared) {
        for (const index of members) {
          const node = specs[index]!.schemas.get(name)!
          if (collectImportedRefNames(node).every((ref) => shared.get(ref)?.has(index))) continue
          members.delete(index)
          changed = true
        }
        if (members.size < 2) shared.delete(name)
      }
    }

    specs.forEach(({ member, parsed }, index) => {
      const schemas = [...shared].flatMap(([name, members]) => (members.has(index) ? [name] : []))
      detected.set(member.config, { shared: { ...member.shared, schemas }, parsed })
    })
  }

  const inputs = new Map<Config, ParsedInput>()
  const result = configs.map((config) => {
    const entry = detected.get(config)
    if (!entry) return config

    const next = { ...config, output: { ...config.output, shared: entry.shared } }
    inputs.set(next, entry.parsed)
    return next
  })

  return { configs: result, conflicts: [...conflicts], inputs }
}
