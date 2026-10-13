import { isValid } from 'verkit'
import type { ExtensionKind } from './defineExtension.ts'

/** A value that survives `JSON.stringify` and `JSON.parse` unchanged. */
export type JSONValue = string | number | boolean | null | Array<JSONValue> | { [key: string]: JSONValue }

/**
 * One form field Studio renders for an extension. It edits the value at `path` in the options
 * object the user passes to the factory.
 */
export type ExtensionManifestOption = {
  /** Stable UI key, unique within the manifest. */
  key: string
  /** Where the value lives, such as `['output', 'path']`. */
  path: Array<string>
  label: string
  description?: string
  type: 'select' | 'boolean' | 'text' | 'number' | 'list'
  /** The extension's runtime default, shown when the option is unset. */
  default?: JSONValue
  /** For `select`. A choice with value `null` leaves the option unset. */
  choices?: Array<{ label?: string; value: JSONValue }>
  /** For `boolean`: the value written for `true`, `true` when unset. */
  trueValue?: JSONValue
  /** For `boolean`: the value written for `false`, `false` when unset. */
  falseValue?: JSONValue
  /** For `list`: template for each entry, where every `"$item"` string is replaced by the entry. */
  item?: JSONValue
  /** For `list`: upper-case each entry before writing it. */
  itemCase?: 'upper'
}

/**
 * The `kubb-extension.json` file an extension package ships at its root. Studio, the kubb.dev
 * registry, and `kubb add` read it.
 */
export type ExtensionManifest = {
  $schema?: string
  kind: ExtensionKind
  /** Equals the extension's `meta.name`. */
  name: string
  /** The factory export users call in `kubb.config.ts`, such as `pluginZod`. */
  export: string
  displayName: string
  description: string
  category?: string
  icon?: { light: string; dark?: string }
  /** HTTPS image or video URLs. */
  media?: Array<string>
  tags?: Array<string>
  docs?: string
  /** People who maintain the extension, shown on its kubb.dev page. */
  maintainers?: Array<{ name: string; github?: string }>
  /** Names of the extensions that must be in the same config, such as `['plugin-ts']`. */
  dependencies?: Array<string>
  /** Names of the extensions used when they are in the config, or needed only for some option values, such as `['plugin-faker']`. */
  optionalDependencies?: Array<string>
  compatibility?: { kubb?: string; node?: string }
  /** Plugins only: `client` ships the HTTP client runtime, `consumer` calls one but ships none. */
  role?: 'client' | 'consumer'
  options?: Array<ExtensionManifestOption>
}

/** What `kubb add` installs: a reviewed npm version, or a GitHub release tag and the commit it points to. */
export type RegistryArtifact =
  | { kind: 'npm'; package: string; version: string }
  | {
      kind: 'github'
      /** The `name` in the root `package.json`, so the package installs under this name. */
      package: string
      /** The release version, equal to `tag` without a leading `v`. */
      version: string
      owner: string
      repo: string
      tag: string
      /** The full commit SHA the tag points to. */
      commit: string
    }

/** One extension in a registry's `index.json`. */
export type RegistryEntry = {
  /** `<owner>/<slug>`, such as `kubb-labs/plugin-zod`. */
  id: string
  kind: ExtensionKind
  type: 'official' | 'community'
  artifact: RegistryArtifact
  repository?: { url: string }
  manifest: ExtensionManifest
  stats?: { downloads?: number; weekly?: number; stars?: number }
  submittedAt: string
  publishedAt: string
  reviewedAt: string
}

/** The registry's `index.json`. */
export type RegistryIndex = { version: 1; generatedAt: string; extensions: Array<RegistryEntry> }

/** One `docs/guides/<id>.md`: `id` is the file name, `title` its `#` heading, `description` the first paragraph. */
export type RegistryGuide = {
  id: string
  title: string
  description: string
  content: string
}

/** The registry's `<owner>/<slug>.json`: an entry plus the Markdown docs its pinned version ships. */
export type RegistryDetail = RegistryEntry & { overview: string | null; options?: string | null; guides?: Array<RegistryGuide> }

const EXTENSION_KINDS = new Set<unknown>(['plugin', 'adapter', 'parser'] satisfies Array<ExtensionKind>)
const OPTION_TYPES = new Set<unknown>(['select', 'boolean', 'text', 'number', 'list'] satisfies Array<ExtensionManifestOption['type']>)
const PACKAGE_NAME = /^(?:@[a-z0-9~][a-z0-9._~-]*\/)?[a-z0-9~][a-z0-9._~-]*$/
const IDENTIFIER = /^[A-Za-z_$][\w$]*$/
const REGISTRY_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*\/[a-z0-9]+(?:-[a-z0-9]+)*$/
const GITHUB_OWNER = /^[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}$/
const GITHUB_REPO = /^(?!\.\.?$)[A-Za-z0-9._-]{1,100}$/
const COMMIT = /^[0-9a-f]{40}$/
/** Option path segments that would reach an object's prototype when Studio writes the value by path. */
const UNSAFE_KEYS = new Set<unknown>(['__proto__', 'constructor', 'prototype'])

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const isOptionalString = (value: unknown) => value === undefined || typeof value === 'string'
const isFilledString = (value: unknown) => typeof value === 'string' && value !== ''
const matches = (pattern: RegExp, value: unknown) => typeof value === 'string' && pattern.test(value)
/** Serializes with sorted object keys, so equal JSON values give equal strings whatever their key order. */
const canonicalJSON = (value: unknown) =>
  JSON.stringify(value, (_key, item: unknown) =>
    isObject(item)
      ? Object.fromEntries(
          Object.keys(item)
            .sort()
            .map((key) => [key, item[key]]),
        )
      : item,
  )

/**
 * Whether `name` is a valid npm package name, such as `@kubb/plugin-ts`. Rejects paths, URLs,
 * `node:` specifiers, and names that start with `-`, so the result is safe to pass to `import()` or
 * a package manager.
 */
export function isPackageName(name: unknown): name is string {
  return typeof name === 'string' && name.length <= 214 && PACKAGE_NAME.test(name)
}

function isMaintainer(value: unknown): boolean {
  return (
    isObject(value) &&
    Object.keys(value).every((key) => key === 'name' || key === 'github') &&
    isFilledString(value.name) &&
    (value.github === undefined || isFilledString(value.github))
  )
}

/** Checks the shape of one manifest option, including that its path cannot reach a prototype. */
function isOption(value: unknown): value is ExtensionManifestOption {
  if (!isObject(value)) return false
  const { key, path, label, description, type, choices, itemCase } = value
  return (
    isFilledString(key) &&
    Array.isArray(path) &&
    path.length > 0 &&
    path.every((segment) => isFilledString(segment) && !UNSAFE_KEYS.has(segment)) &&
    isFilledString(label) &&
    isOptionalString(description) &&
    OPTION_TYPES.has(type) &&
    (choices === undefined || (Array.isArray(choices) && choices.every((choice) => isObject(choice) && 'value' in choice && isOptionalString(choice.label)))) &&
    (itemCase === undefined || itemCase === 'upper')
  )
}

/**
 * What is wrong with the options of a well-formed manifest, beyond their shape: keys are unique, a
 * select has choices, and a select's default is one of its choice values. Empty when they pass.
 */
export function manifestProblems({ options = [] }: ExtensionManifest): Array<string> {
  const seen = new Set<string>()
  return options.flatMap((option) => {
    const problems = seen.has(option.key) ? [`option "${option.key}" is declared more than once`] : []
    seen.add(option.key)
    if (option.type !== 'select') return problems
    if (!option.choices?.length) return [...problems, `option "${option.key}" is a select without choices`]
    const knownDefault = !('default' in option) || option.choices.some((choice) => canonicalJSON(choice.value) === canonicalJSON(option.default))
    return knownDefault ? problems : [...problems, `option "${option.key}" has a default that is not one of its choices`]
  })
}

/**
 * Checks a parsed `kubb-extension.json` or a registry response before Kubb or Studio uses it: the
 * fields Kubb reads, every option's shape (including option paths that cannot reach a prototype),
 * and `manifestProblems`. A malformed manifest is skipped instead of trusted.
 */
export function isExtensionManifest(value: unknown): value is ExtensionManifest {
  if (!isObject(value)) return false
  const { kind, name, export: exportName, displayName, description, maintainers, dependencies, optionalDependencies, compatibility, options } = value
  return (
    EXTENSION_KINDS.has(kind) &&
    isPackageName(name) &&
    typeof exportName === 'string' &&
    IDENTIFIER.test(exportName) &&
    typeof displayName === 'string' &&
    typeof description === 'string' &&
    (maintainers === undefined || (Array.isArray(maintainers) && maintainers.every(isMaintainer))) &&
    (dependencies === undefined || (Array.isArray(dependencies) && dependencies.every(isPackageName))) &&
    (optionalDependencies === undefined || (Array.isArray(optionalDependencies) && optionalDependencies.every(isPackageName))) &&
    (compatibility === undefined ||
      (isObject(compatibility) && Object.entries(compatibility).every(([key, range]) => (key === 'kubb' || key === 'node') && typeof range === 'string'))) &&
    (options === undefined || (Array.isArray(options) && options.every(isOption))) &&
    manifestProblems(value as ExtensionManifest).length === 0
  )
}

/** Checks that no artifact field can reach a package manager as a flag or path, and that a GitHub tag names the version. */
function isRegistryArtifact(value: unknown): value is RegistryArtifact {
  if (!isObject(value) || !isPackageName(value.package) || typeof value.version !== 'string' || !isValid(value.version)) return false
  if (value.kind === 'npm') return true
  return (
    value.kind === 'github' &&
    matches(GITHUB_OWNER, value.owner) &&
    matches(GITHUB_REPO, value.repo) &&
    (value.tag === value.version || value.tag === `v${value.version}`) &&
    matches(COMMIT, value.commit)
  )
}

/**
 * Checks one entry of a registry's `index.json` or `<owner>/<slug>.json`: a full `<owner>/<slug>` id,
 * an npm or GitHub artifact pinned to a valid version, and a valid manifest of the entry's kind.
 */
export function isRegistryEntry(value: unknown): value is RegistryEntry {
  if (!isObject(value)) return false
  const { id, kind, type, artifact, manifest } = value
  return (
    typeof id === 'string' &&
    REGISTRY_ID.test(id) &&
    EXTENSION_KINDS.has(kind) &&
    (type === 'official' || type === 'community') &&
    isRegistryArtifact(artifact) &&
    isExtensionManifest(manifest) &&
    manifest.kind === kind
  )
}
