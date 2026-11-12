import { resolve } from 'node:path'
import { ast, type InputNode, type SchemaNode } from '@kubb/ast'
import type { Hookable } from './Hookable.ts'
import { inputToAdapterSource, parseAdapterSource } from './input.ts'
import type { KubbHooks, UserConfig } from './types.ts'

// Skips the target a ref embeds, so recursive schemas serialize and only the ref itself is compared.
function toShape(node: SchemaNode): string {
  return JSON.stringify(node, function (key, value) {
    return key === 'schema' && this.type === 'ref' ? undefined : value
  })
}

/**
 * What one config of a `defineConfig([...])` array shares with the others. Pass it to `createKubb` as `sharedSchemas`.
 */
export type SharedSchemas = {
  /**
   * The names of the shared schemas this config's spec defines.
   */
  names: Array<string>
  /**
   * Empties `shared.path` before this config writes. Set on the first config of each shared directory when any of them
   * sets `output.clean`, so a later config never deletes what an earlier one wrote.
   */
  clean: boolean
}

type GroupMember = { config: UserConfig; root: string; index: number }

// The sources each run wrote under a shared directory, keyed by file path, so a config that writes one differently is reported.
const sharedWrites = new WeakMap<SharedSchemas, Map<string, string>>()

/**
 * The sources the configs sharing `entry`'s directory have written under it in this run. Empty for an entry that did not
 * come from `detectSharedSchemas`.
 */
export function getSharedWrites(entry: SharedSchemas): Map<string, string> {
  return sharedWrites.get(entry) ?? new Map()
}

/** A spec's named schemas, each with its shape and the names of the schemas it references. */
type Spec = Map<string, { shape: string; refs: ReadonlyArray<string> }>

/** Each shared schema name with the indexes of the specs that share it. */
type SharedBy = Map<string, Set<number>>

// A shared file imports its refs from the shared directory, so a spec keeps sharing a schema only while it shares every
// ref of that schema too. Dropping one can leave another without its refs, so this runs again until nothing drops.
function dropUnsharedRefs(sharedBy: SharedBy, specs: Array<Spec>): SharedBy {
  const kept: SharedBy = new Map()
  for (const [name, specIndexes] of sharedBy) {
    const withSharedRefs = new Set([...specIndexes].filter((index) => specs[index]!.get(name)!.refs.every((ref) => sharedBy.get(ref)?.has(index))))
    if (withSharedRefs.size >= 2) kept.set(name, withSharedRefs)
  }

  const settled = [...sharedBy].every(([name, specIndexes]) => kept.get(name)?.size === specIndexes.size)
  return settled ? kept : dropUnsharedRefs(kept, specs)
}

// Fills `names` on the entries of one shared directory, and returns the names its configs define differently.
async function detectGroup(group: Array<GroupMember>, result: Array<SharedSchemas | undefined>): Promise<Set<string>> {
  const inputs: Array<InputNode> = []
  try {
    // Sequential, since configs may share one adapter instance.
    for (const { config, root } of group) {
      inputs.push(await parseAdapterSource({ adapter: config.adapter!, source: inputToAdapterSource({ input: config.input, root }) }))
    }
  } catch {
    // The build parses the spec again and reports why it failed.
    return new Set()
  }
  const specs: Array<Spec> = inputs.map(
    (input) => new Map(input.schemas.flatMap((node) => (node.name ? [[node.name, { shape: toShape(node), refs: ast.graph.getImportedNames(node) }]] : []))),
  )

  // Each schema name, with the specs that define it grouped by shape.
  const byName = new Map<string, Map<string, Set<number>>>()
  specs.forEach((schemas, index) => {
    for (const [name, { shape }] of schemas) {
      const byShape = byName.get(name) ?? new Map<string, Set<number>>()
      byName.set(name, byShape.set(shape, (byShape.get(shape) ?? new Set<number>()).add(index)))
    }
  })

  // The largest group of specs that define a name the same shares it, the first group on a tie.
  const candidates: SharedBy = new Map()
  const conflicts = new Set<string>()
  for (const [name, byShape] of byName) {
    if (byShape.size > 1) conflicts.add(name)
    const largest = [...byShape.values()].reduce((best, next) => (next.size > best.size ? next : best))
    if (largest.size >= 2) candidates.set(name, largest)
  }

  const sharedBy = dropUnsharedRefs(candidates, specs)
  group.forEach(({ index }, specIndex) => {
    result[index]!.names = [...sharedBy].flatMap(([name, specIndexes]) => (specIndexes.has(specIndex) ? [name] : []))
  })
  return conflicts
}

/**
 * Works out what the configs of a `defineConfig([...])` array share. Returns one entry per config, in order, to pass to
 * `createKubb` as `sharedSchemas`, and `undefined` for a config without `shared`. Configs are compared per shared directory. A
 * schema is shared by the largest group of two or more configs that define it identically, the first group on a tie. A
 * config shares it only when it also shares every schema it references. Schemas the configs define differently are
 * reported as `kubb:warn`. When any config of a shared directory sets `output.clean`, the first one empties it.
 *
 * shortcut: each build parses its spec again, so a URL or git branch that changes between the two parses can leave a stale
 * list; pass the parsed spec to the build if that shows up.
 */
export async function detectSharedSchemas(configs: Array<UserConfig>, hooks: Hookable<KubbHooks>): Promise<Array<SharedSchemas | undefined>> {
  const groups = new Map<string, Array<GroupMember>>()
  configs.forEach((config, index) => {
    if (!config.shared || !config.adapter) return
    const root = config.root || process.cwd()
    const key = resolve(root, config.shared.path)
    groups.set(key, [...(groups.get(key) ?? []), { config, root, index }])
  })

  const result: Array<SharedSchemas | undefined> = configs.map(() => undefined)
  const conflicts = new Set<string>()
  for (const group of groups.values()) {
    // Only the first config empties the shared directory, so a later one never deletes what an earlier one wrote.
    const clean = group.some(({ config }) => config.output.clean)
    const written = new Map<string, string>()
    group.forEach(({ index }, i) => {
      const entry: SharedSchemas = { names: [], clean: clean && i === 0 }
      sharedWrites.set(entry, written)
      result[index] = entry
    })
    if (group.length < 2) continue
    for (const name of await detectGroup(group, result)) conflicts.add(name)
  }

  if (conflicts.size > 0) {
    await hooks.callHook('kubb:warn', {
      message: `The specs define these schemas differently: ${[...conflicts].join(', ')}.`,
      info: 'The largest group of specs that define one the same shares it. Every other spec keeps its own copy, with the schemas that reference it.',
    })
  }
  return result
}
