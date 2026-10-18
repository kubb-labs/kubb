import { resolve } from 'node:path'
import { collectImportedRefNames, type SchemaNode } from '@kubb/ast'
import { inputToAdapterSource } from './input.ts'
import type { Config } from './types.ts'

/** Skips the target a ref embeds, so recursive schemas serialize and only the ref itself is compared. */
function toShape(node: SchemaNode): string {
  return JSON.stringify(node, function (key, value) {
    return key === 'schema' && this.type === 'ref' ? undefined : value
  })
}

/**
 * Fills `output.shared.schemas` on configs that leave it out. Configs with the same shared path share every schema
 * they all define identically, as long as the schemas it references are shared too. `conflicts` lists the names
 * they all define, but differently, which stay in each config's own output.
 *
 * @example
 * ```ts
 * const { configs: detected, conflicts } = await detectSharedSchemas(configs)
 * ```
 */
export async function detectSharedSchemas(configs: Array<Config>): Promise<{ configs: Array<Config>; conflicts: Array<string> }> {
  const groups = new Map<string, Array<Config>>()
  for (const config of configs) {
    const shared = config.output.shared
    if (!shared || shared.schemas || !config.adapter) continue

    const key = resolve(config.root, shared.path)
    groups.set(key, [...(groups.get(key) ?? []), config])
  }

  const detected = new Map<Config, Array<string>>()
  const conflicts = new Set<string>()
  for (const group of groups.values()) {
    if (group.length < 2) continue

    const parsed: Array<Map<string, SchemaNode>> = []
    // Sequential, since configs may share one adapter instance.
    for (const config of group) {
      const { schemas } = await config.adapter!.parse(inputToAdapterSource(config))
      parsed.push(new Map(schemas.flatMap((node) => (node.name ? [[node.name, node] as const] : []))))
    }

    const first = parsed[0]!
    const rest = parsed.slice(1)
    const names = new Set<string>()
    for (const [name, node] of first) {
      const others = rest.map((schemas) => schemas.get(name))
      if (others.some((other) => !other)) continue

      if (others.every((other) => toShape(other!) === toShape(node))) names.add(name)
      else conflicts.add(name)
    }

    // A shared file imports its refs from the shared directory, so drop schemas until every ref is shared.
    let changed = true
    while (changed) {
      changed = false
      for (const name of names) {
        if (collectImportedRefNames(first.get(name)!).every((ref) => names.has(ref))) continue
        names.delete(name)
        changed = true
      }
    }

    for (const config of group) detected.set(config, [...names])
  }

  return {
    configs: configs.map((config) => {
      const schemas = detected.get(config)
      return schemas ? { ...config, output: { ...config.output, shared: { ...config.output.shared!, schemas } } } : config
    }),
    conflicts: [...conflicts],
  }
}
