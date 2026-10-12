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
  compatibility?: { kubb?: string; node?: string }
  /** Plugins only: `client` ships the HTTP client runtime, `consumer` calls one but ships none. */
  role?: 'client' | 'consumer'
  options?: Array<ExtensionManifestOption>
}

/** One extension in a registry's `index.json`. */
export type RegistryEntry = {
  /** `<owner>/<slug>`, such as `kubb-labs/plugin-zod`. */
  id: string
  kind: ExtensionKind
  type: 'official' | 'community'
  /** The reviewed npm version to install. */
  artifact: { kind: 'npm'; package: string; version: string }
  repository?: { url: string }
  manifest: ExtensionManifest
  stats?: { downloads?: number; weekly?: number; stars?: number }
  submittedAt: string
  publishedAt: string
  reviewedAt: string
}

/** The registry's `index.json`. */
export type RegistryIndex = { version: 1; generatedAt: string; extensions: Array<RegistryEntry> }

/** The registry's `<owner>/<slug>.json`: an entry plus its `OVERVIEW.md`. */
export type RegistryDetail = RegistryEntry & { overview: string | null }

const EXTENSION_KINDS = new Set<unknown>(['plugin', 'adapter', 'parser'] satisfies Array<ExtensionKind>)
const PACKAGE_NAME = /^(?:@[a-z0-9~][a-z0-9._~-]*\/)?[a-z0-9~][a-z0-9._~-]*$/
const IDENTIFIER = /^[A-Za-z_$][\w$]*$/

/**
 * Whether `name` is a valid npm package name, such as `@kubb/plugin-ts`. Rejects paths, URLs,
 * `node:` specifiers, and names that start with `-`, so the result is safe to pass to `import()` or
 * a package manager.
 */
export function isPackageName(name: unknown): name is string {
  return typeof name === 'string' && name.length <= 214 && PACKAGE_NAME.test(name)
}

/**
 * Checks the fields Kubb reads from a parsed `kubb-extension.json` or a registry response, so a
 * malformed file is skipped instead of trusted.
 */
export function isExtensionManifest(value: unknown): value is ExtensionManifest {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  const { kind, name, export: exportName, displayName, description, compatibility, options } = value as Record<string, unknown>
  const validCompatibility =
    compatibility === undefined ||
    (typeof compatibility === 'object' &&
      compatibility !== null &&
      Object.entries(compatibility).every(([key, range]) => (key === 'kubb' || key === 'node') && typeof range === 'string'))

  return (
    EXTENSION_KINDS.has(kind) &&
    isPackageName(name) &&
    typeof exportName === 'string' &&
    IDENTIFIER.test(exportName) &&
    typeof displayName === 'string' &&
    typeof description === 'string' &&
    validCompatibility &&
    (options === undefined || Array.isArray(options))
  )
}
