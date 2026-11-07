import { resolve } from 'node:path'
import { collectImportedRefNames, type InputNode, type SchemaNode } from '@kubb/ast'
import type { Adapter } from './createAdapter.ts'
import { type Diagnostic, Diagnostics } from './Diagnostics.ts'
import { inputToAdapterSource, parseAdapterSource } from './input.ts'
import type { Config } from './types.ts'

/**
 * A spec parsed ahead of its build, with what the adapter reported while parsing it.
 */
export type ParsedInput = { inputNode: InputNode; diagnostics: Array<Diagnostic> }

/**
 * What detection found for one config, in the order given: the config with `output.shared.schemas` filled in, its parsed
 * spec when it was compared, and whether its build empties `output.shared.path` before writing (see `CreateKubbOptions`).
 */
export type DetectedConfig = { config: Config; parsed?: ParsedInput; cleanSharedOutput: boolean }

type Detected = {
  configs: Array<DetectedConfig>
  conflicts: Array<string>
  /**
   * The plugins that configs with the same shared path set up with different options. Each config writes the shared
   * schemas it defines, so those configs can overwrite each other's shared files.
   */
  mismatchedPlugins: Array<string>
}

// Skips the target a ref embeds, so recursive schemas serialize and only the ref itself is compared.
function toShape(node: SchemaNode): string {
  return JSON.stringify(node, function (key, value) {
    return key === 'schema' && this.type === 'ref' ? undefined : value
  })
}

// Functions drop out and keys are sorted, so only the plain settings are compared. Options JSON cannot hold, such as a cycle, are skipped.
function toOptionsShape(options: unknown): string | undefined {
  try {
    return JSON.stringify(options, (_, value) =>
      value && typeof value === 'object' && !Array.isArray(value) ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b))) : value,
    )
  } catch {
    return undefined
  }
}

// Collects what the adapter reports, for the build to report. A spec that fails to parse throws the way the build does, so a caller can tell it from a bug in detection.
async function parse(config: Config, adapter: Adapter): Promise<ParsedInput> {
  const diagnostics: Array<Diagnostic> = []
  const inputNode = await Diagnostics.scope(
    (diagnostic) => diagnostics.push(diagnostic),
    () => parseAdapterSource(adapter, inputToAdapterSource(config)),
  )
  return { inputNode, diagnostics }
}

function setSharedSchemas(config: Config, schemas: Array<string>): Config {
  return { ...config, output: { ...config.output, shared: { ...config.output.shared!, schemas } } }
}

/**
 * Returns one entry per config, in order. Fills `output.shared.schemas` on every config that sets `output.shared`. Among
 * configs with the same shared path, a schema is shared by the largest group of two or more configs that define it
 * identically, the first group on a tie. A config shares it only when it also shares every schema it references. Each
 * config lists only the shared schemas it defines. `conflicts` lists the names that configs define differently. A config
 * outside the sharing group keeps its own copy.
 */
export async function detectSharedSchemas(configs: Array<Config>): Promise<Detected> {
  const detected: Array<DetectedConfig> = configs.map((config) => ({ config, cleanSharedOutput: false }))
  const groups = new Map<string, Array<DetectedConfig>>()
  for (const entry of detected) {
    const { shared } = entry.config.output
    if (!shared || !entry.config.adapter) continue

    const key = resolve(entry.config.root, shared.path)
    groups.set(key, [...(groups.get(key) ?? []), entry])
  }

  const conflicts = new Set<string>()
  const mismatchedPlugins = new Set<string>()
  for (const group of groups.values()) {
    group[0]!.cleanSharedOutput = group.some(({ config }) => config.output.clean)
    if (group.length < 2) continue

    const optionShapes = new Map<string, Set<string>>()
    for (const { config } of group) {
      for (const plugin of config.plugins) {
        // The build reports a plugin without a name, so detection skips it.
        const name = plugin.meta?.name ?? plugin.name
        const shape = toOptionsShape(plugin.options)
        if (name && shape !== undefined) optionShapes.set(name, (optionShapes.get(name) ?? new Set()).add(shape))
      }
    }
    for (const [name, shapes] of optionShapes) if (shapes.size > 1) mismatchedPlugins.add(name)

    const specs: Array<{ entry: DetectedConfig; parsed: ParsedInput; schemas: Map<string, SchemaNode> }> = []
    try {
      // Sequential, since configs may share one adapter instance.
      for (const entry of group) {
        const parsed = await parse(entry.config, entry.config.adapter!)
        specs.push({ entry, parsed, schemas: new Map(parsed.inputNode.schemas.flatMap((node) => (node.name ? [[node.name, node] as const] : []))) })
      }
    } catch (error) {
      // A failed parse is that build's to report, so the group shares nothing until every spec parses. Anything else is a bug here.
      if (!(error instanceof Diagnostics.Error)) throw error
      for (const entry of group) entry.config = setSharedSchemas(entry.config, [])
      continue
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

    specs.forEach(({ entry, parsed }, index) => {
      entry.config = setSharedSchemas(
        entry.config,
        [...shared].flatMap(([name, members]) => (members.has(index) ? [name] : [])),
      )
      entry.parsed = parsed
    })
  }

  return { configs: detected, conflicts: [...conflicts], mismatchedPlugins: [...mismatchedPlugins] }
}
