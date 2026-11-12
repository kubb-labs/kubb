import { resolve } from 'node:path'
import { ast, type SchemaNode } from '@kubb/ast'
import type { SharedOutput } from './definePlugin.ts'
import type { Hookable } from './Hookable.ts'
import { inputToAdapterSource, parseAdapterSource } from './input.ts'
import type { Config, KubbHooks } from './types.ts'

// Skips the target a ref embeds, so recursive schemas serialize and only the ref itself is compared.
function toShape(node: SchemaNode): string {
  return JSON.stringify(node, function (key, value) {
    return key === 'schema' && this.type === 'ref' ? undefined : value
  })
}

// Fills `output.shared.schemas` on the configs of one shared directory, and returns the names they define differently.
async function shareGroup(group: Array<{ config: Config; index: number }>, result: Array<Config>): Promise<Array<string>> {
  const specs: Array<Map<string, SchemaNode>> = []
  try {
    // Sequential, since configs may share one adapter instance.
    for (const { config } of group) {
      const input = await parseAdapterSource(config.adapter!, inputToAdapterSource(config))
      specs.push(new Map(input.schemas.flatMap((node) => (node.name ? [[node.name, node] as const] : []))))
    }
  } catch {
    // The build parses the spec again and reports why it failed.
    return []
  }

  // Each name with the indexes of the specs that share it.
  const shared = new Map<string, Set<number>>()
  const conflicts: Array<string> = []
  for (const name of new Set(specs.flatMap((schemas) => [...schemas.keys()]))) {
    const byShape = new Map<string, Array<number>>()
    specs.forEach((schemas, index) => {
      const node = schemas.get(name)
      if (!node) return
      const shape = toShape(node)
      byShape.set(shape, [...(byShape.get(shape) ?? []), index])
    })
    if (byShape.size > 1) conflicts.push(name)

    const largest = [...byShape.values()].reduce((best, next) => (next.length > best.length ? next : best))
    if (largest.length >= 2) shared.set(name, new Set(largest))
  }

  // A shared file imports its refs from the shared directory, so drop a spec from a schema until it shares every ref too.
  let changed = true
  while (changed) {
    changed = false
    for (const [name, members] of shared) {
      for (const index of members) {
        if (ast.graph.getImportedNames(specs[index]!.get(name)!).every((ref) => shared.get(ref)?.has(index))) continue
        members.delete(index)
        changed = true
      }
      if (members.size < 2) shared.delete(name)
    }
  }

  group.forEach(({ index }, specIndex) => {
    const schemas = [...shared].flatMap(([name, members]) => (members.has(specIndex) ? [name] : []))
    result[index] = withShared(result[index]!, { schemas })
  })
  return conflicts
}

function withShared(config: Config, patch: Partial<SharedOutput>): Config {
  return { ...config, output: { ...config.output, shared: { ...config.output.shared!, ...patch } } }
}

/**
 * Returns `configs` in order, with `output.shared` filled in on each config that sets it. Configs are compared per shared
 * directory. A schema is shared by the largest group of two or more configs that define it identically, the first group on a
 * tie. A config shares it only when it also shares every schema it references. Schemas the configs define differently are
 * reported as `kubb:warn`. When any config of a shared directory sets `output.clean`, the first one empties it.
 *
 * shortcut: each build parses its spec again, so a URL or git branch that changes between the two parses can leave a stale
 * list; pass the parsed spec to the build if that shows up.
 */
export async function detectSharedSchemas(configs: Array<Config>, hooks: Hookable<KubbHooks>): Promise<Array<Config>> {
  const groups = new Map<string, Array<{ config: Config; index: number }>>()
  configs.forEach((config, index) => {
    if (!config.output.shared || !config.adapter) return
    const key = resolve(config.root, config.output.shared.path)
    groups.set(key, [...(groups.get(key) ?? []), { config, index }])
  })

  const result = [...configs]
  const conflicts = new Set<string>()
  for (const group of groups.values()) {
    // Only the first config empties the shared directory, so a later one never deletes what an earlier one wrote.
    if (group.some(({ config }) => config.output.clean)) group.forEach(({ index }, i) => (result[index] = withShared(result[index]!, { clean: i === 0 })))
    if (group.length < 2) continue
    for (const name of await shareGroup(group, result)) conflicts.add(name)
  }

  if (conflicts.size > 0) {
    await hooks.callHook('kubb:warn', {
      message: `The specs define these schemas differently: ${[...conflicts].join(', ')}.`,
      info: 'The largest group of specs that define one the same shares it. Every other spec keeps its own copy, with the schemas that reference it.',
    })
  }
  return result
}
