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
 * What one config of a `defineConfig([...])` array shares with the others. Pass it to `createKubb` as `shared`.
 */
export type SharedBuild = {
  /**
   * The shared schemas this config's spec defines.
   */
  schemas: Array<string>
  /**
   * Empties `shared.path` before this config writes. Set on the first config of each shared directory when any of them
   * sets `output.clean`, so a later config never deletes what an earlier one wrote.
   */
  clean: boolean
}

type GroupMember = { config: UserConfig; root: string; index: number }

// The sources each run wrote under a shared directory, keyed by file path, so a config that writes one differently is reported.
const sharedWrites = new WeakMap<SharedBuild, Map<string, string>>()

/**
 * The sources the configs sharing `build`'s directory have written under it in this run. Empty for a build that did not
 * come from `detectSharedSchemas`.
 */
export function getSharedWrites(build: SharedBuild): Map<string, string> {
  return sharedWrites.get(build) ?? new Map()
}

/** A spec's named schemas, each with its shape and the names of the schemas it references. */
type Spec = Map<string, { shape: string; refs: ReadonlyArray<string> }>

/** Each shared schema name with the indexes of the specs that share it. */
type Sharing = Map<string, Set<number>>

// A shared file imports its refs from the shared directory, so a spec keeps sharing a schema only while it shares every
// ref of that schema too. Dropping one can leave another without its refs, so this runs again until nothing drops.
function dropUnsharedRefs(shared: Sharing, specs: Array<Spec>): Sharing {
  const kept: Sharing = new Map()
  for (const [name, members] of shared) {
    const sharing = new Set([...members].filter((index) => specs[index]!.get(name)!.refs.every((ref) => shared.get(ref)?.has(index))))
    if (sharing.size >= 2) kept.set(name, sharing)
  }

  const settled = [...shared].every(([name, members]) => kept.get(name)?.size === members.size)
  return settled ? kept : dropUnsharedRefs(kept, specs)
}

// Fills `schemas` on the builds of one shared directory, and returns the names its configs define differently.
async function shareGroup(group: Array<GroupMember>, result: Array<SharedBuild | undefined>): Promise<Set<string>> {
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
  const candidates: Sharing = new Map()
  const conflicts = new Set<string>()
  for (const [name, byShape] of byName) {
    if (byShape.size > 1) conflicts.add(name)
    const largest = [...byShape.values()].reduce((best, next) => (next.size > best.size ? next : best))
    if (largest.size >= 2) candidates.set(name, largest)
  }

  const shared = dropUnsharedRefs(candidates, specs)
  group.forEach(({ index }, specIndex) => {
    result[index]!.schemas = [...shared].flatMap(([name, members]) => (members.has(specIndex) ? [name] : []))
  })
  return conflicts
}

/**
 * Works out what the configs of a `defineConfig([...])` array share. Returns one entry per config, in order, to pass to
 * `createKubb` as `shared`, and `undefined` for a config without `shared`. Configs are compared per shared directory. A
 * schema is shared by the largest group of two or more configs that define it identically, the first group on a tie. A
 * config shares it only when it also shares every schema it references. Schemas the configs define differently are
 * reported as `kubb:warn`. When any config of a shared directory sets `output.clean`, the first one empties it.
 *
 * shortcut: each build parses its spec again, so a URL or git branch that changes between the two parses can leave a stale
 * list; pass the parsed spec to the build if that shows up.
 */
export async function detectSharedSchemas(configs: Array<UserConfig>, hooks: Hookable<KubbHooks>): Promise<Array<SharedBuild | undefined>> {
  const groups = new Map<string, Array<GroupMember>>()
  configs.forEach((config, index) => {
    if (!config.shared || !config.adapter) return
    const root = config.root || process.cwd()
    const key = resolve(root, config.shared.path)
    groups.set(key, [...(groups.get(key) ?? []), { config, root, index }])
  })

  const result: Array<SharedBuild | undefined> = configs.map(() => undefined)
  const conflicts = new Set<string>()
  for (const group of groups.values()) {
    // Only the first config empties the shared directory, so a later one never deletes what an earlier one wrote.
    const clean = group.some(({ config }) => config.output.clean)
    const written = new Map<string, string>()
    group.forEach(({ index }, i) => {
      const build = { schemas: [], clean: clean && i === 0 }
      sharedWrites.set(build, written)
      result[index] = build
    })
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
