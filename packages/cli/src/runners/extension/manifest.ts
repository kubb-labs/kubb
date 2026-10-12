import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { kubbManifestSchemaUrl, toExtensionManifest } from '@kubb/core'
import type { ExtensionKind, ExtensionManifest, ExtensionMeta, KubbManifest, ManifestContributor, OptionsDocument, StandardSchemaV1 } from '@kubb/core'
import type { OptionAnnotation, OptionTypes } from './typescript.ts'
import { loadTypeScript, readOptionTypes } from './typescript.ts'

type Person = string | { name?: string; email?: string; url?: string }

/**
 * The `package.json` fields `kubb extension build` reads.
 */
export type PackageJson = {
  name?: string
  version?: string
  main?: string
  module?: string
  exports?: unknown
  repository?: string | { url?: string; directory?: string }
  bugs?: string | { url?: string }
  author?: Person
  contributors?: Array<Person>
  engines?: { node?: string }
}

/**
 * A factory the package exports, as found on the imported entry.
 */
export type ExportedExtension = {
  exportName: string
  kind: ExtensionKind
  meta: ExtensionMeta
  schema?: StandardSchemaV1
}

const extensionKinds = new Set<unknown>(['plugin', 'adapter', 'parser'] satisfies Array<ExtensionKind>)

function pickExport(target: unknown): string | undefined {
  if (typeof target === 'string') return target
  if (!target || typeof target !== 'object' || Array.isArray(target)) return undefined

  const conditions = target as Record<string, unknown>
  for (const condition of ['import', 'node', 'default', 'require']) {
    const picked = pickExport(conditions[condition])
    if (picked) return picked
  }
  return undefined
}

/**
 * Returns the absolute path of the built entry: `exports['.']`, else `module`, else `main`.
 */
export function resolveBuiltEntry(packageJson: PackageJson, cwd: string): string {
  const { exports } = packageJson
  const rootExport = exports && typeof exports === 'object' && !Array.isArray(exports) && '.' in exports ? (exports as Record<string, unknown>)['.'] : exports
  const entry = pickExport(rootExport) ?? packageJson.module ?? packageJson.main
  if (!entry) throw new Error('package.json has no `exports`, `module` or `main` entry to import. Build the package first.')

  return path.resolve(cwd, entry)
}

/**
 * Returns every export that is an extension factory: a function with a `kind` and `meta.name`.
 * An export listed under several names is returned once.
 */
export function collectExtensions(module: Record<string, unknown>): Array<ExportedExtension> {
  const seen = new Set<unknown>()
  const extensions: Array<ExportedExtension> = []

  for (const [exportName, value] of Object.entries(module)) {
    if (typeof value !== 'function' || seen.has(value)) continue

    const { kind, meta, schema } = value as Partial<ExportedExtension>
    if (!extensionKinds.has(kind) || typeof meta?.name !== 'string') continue

    seen.add(value)
    extensions.push({ exportName, kind: kind!, meta, ...(schema && { schema }) })
  }

  return extensions
}

function resolveRef(node: OptionsDocument, root: OptionsDocument): OptionsDocument {
  if (!node.$ref?.startsWith('#')) return node

  const target = node.$ref
    .slice(2)
    .split('/')
    .filter(Boolean)
    .reduce<unknown>((current, segment) => (current as Record<string, unknown> | undefined)?.[segment], root)
  return (target as OptionsDocument | undefined) ?? node
}

function findNodes(node: OptionsDocument, [head, ...rest]: Array<string>, root: OptionsDocument): Array<OptionsDocument> {
  const resolved = resolveRef(node, root)
  const branches = [resolved, ...(resolved.anyOf ?? []), ...(resolved.oneOf ?? []), ...(resolved.allOf ?? [])].map((branch) => resolveRef(branch, root))
  const matches = branches.flatMap((branch) => (branch.properties?.[head!] ? [branch.properties[head!]!] : []))

  return rest.length ? matches.flatMap((match) => findNodes(match, rest, root)) : matches
}

function applyAnnotation(node: OptionsDocument, annotation: OptionAnnotation): void {
  if (annotation.description) node.description = annotation.description
  if (annotation.deprecated) node.deprecated = true
  if (annotation.examples) node.examples = annotation.examples
  if (annotation.docs) node['x-kubb-docs'] = annotation.docs
  node['x-kubb-type'] = annotation.type

  // A schema default is what the factory applies, so it wins over the `@default` tag.
  if (!annotation.default || 'default' in node || node['x-kubb-default']) return
  if ('value' in annotation.default) node.default = annotation.default.value
  else node['x-kubb-default'] = annotation.default.text
}

/**
 * Sets the JSDoc text, `@deprecated`, `@example`, `@see`, `@default` and the TypeScript type of each option
 * on the matching node of `document`. The first annotation of a path wins.
 */
export function annotateOptions(document: OptionsDocument, annotations: OptionTypes['annotations']): OptionsDocument {
  const applied = new Set<string>()

  for (const { path: optionPath, annotation } of annotations) {
    const key = JSON.stringify(optionPath)
    if (applied.has(key)) continue
    applied.add(key)

    for (const node of findNodes(document, optionPath, document)) applyAnnotation(node, annotation)
  }
  return document
}

function toContributor(person: Person): ManifestContributor | undefined {
  if (typeof person !== 'string')
    return person.name ? { name: person.name, ...(person.email && { email: person.email }), ...(person.url && { url: person.url }) } : undefined

  // npm's "Name <email> (url)" shorthand.
  const match = /^([^<(]+?)\s*(?:<([^>]+)>)?\s*(?:\(([^)]+)\))?$/.exec(person.trim())
  if (!match?.[1]) return undefined
  return { name: match[1], ...(match[2] && { email: match[2] }), ...(match[3] && { url: match[3] }) }
}

function toRepositoryUrl(url: string): string {
  const shorthand = /^(?:github:)?([\w.-]+\/[\w.-]+)$/.exec(url)
  if (shorthand) return `https://github.com/${shorthand[1]}`
  return url.replace(/^git\+/, '').replace(/\.git$/, '')
}

/**
 * Returns the `package.json` fields a manifest carries next to its extensions.
 */
export function readPackageFields(packageJson: PackageJson): Omit<KubbManifest, 'extensions'> {
  const { name, version, repository, bugs, author, contributors = [], engines } = packageJson
  if (!name || !version) throw new Error('package.json needs a `name` and a `version` to build a manifest.')

  const repositoryUrl = typeof repository === 'string' ? repository : repository?.url
  const directory = typeof repository === 'object' ? repository.directory : undefined
  const bugsUrl = typeof bugs === 'string' ? bugs : bugs?.url
  const people = (author ? [author, ...contributors] : contributors).map(toContributor).filter((person) => person !== undefined)

  return {
    $schema: kubbManifestSchemaUrl,
    name,
    version,
    ...(repositoryUrl && { repository: { url: toRepositoryUrl(repositoryUrl), ...(directory && { directory }) } }),
    ...(bugsUrl && { bugs: bugsUrl }),
    ...(people.length > 0 && { contributors: people }),
    ...(engines?.node && { engines: { node: engines.node } }),
  }
}

/**
 * Builds the manifest of the package in `cwd`. Imports its built entry to find the extensions, then reads each
 * extension's options type from the TypeScript `entry`. The options document comes from the extension's schema
 * when it can convert to JSON Schema, else from the TypeScript type.
 */
export async function buildManifest({ cwd, entry }: { cwd: string; entry: string }): Promise<KubbManifest> {
  const packageJson = JSON.parse(await readFile(path.join(cwd, 'package.json'), 'utf8')) as PackageJson
  const packageFields = readPackageFields(packageJson)
  const builtEntry = resolveBuiltEntry(packageJson, cwd)

  const extensions = collectExtensions((await import(pathToFileURL(builtEntry).href)) as Record<string, unknown>)
  if (extensions.length === 0) {
    throw new Error(`${path.relative(cwd, builtEntry)} exports no plugin, adapter or parser. Export the result of definePlugin, createAdapter or defineParser.`)
  }

  const ts = await loadTypeScript()
  const optionTypes = readOptionTypes(ts, { cwd, entry: path.resolve(cwd, entry), exportNames: extensions.map(({ exportName }) => exportName) })

  return {
    ...packageFields,
    extensions: extensions.map(({ exportName, kind, meta, schema }): ExtensionManifest => {
      const manifest = toExtensionManifest({ kind, meta, schema, exportName })
      const types = optionTypes.get(exportName)
      if (!types) return manifest

      const document = Object.keys(manifest.options).length > 0 ? manifest.options : types.document
      return { ...manifest, options: annotateOptions(document, types.annotations) }
    }),
  }
}
