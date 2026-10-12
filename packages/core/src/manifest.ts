import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import type { ExtensionKind, ExtensionMeta } from './defineExtension.ts'
import type { StandardJSONSchemaV1, StandardSchemaV1 } from './standardSchema.ts'

/** URL of {@link kubbManifestJsonSchema}. Manifests set it as `$schema`. */
export const kubbManifestSchemaUrl = 'https://kubb.dev/schemas/kubb.json'

/** A value an option is compared against in an `x-kubb-when` condition. */
export type OptionWhenValue = string | number | boolean | null

/** Kubb's `x-kubb-*` keys on an option. Studio and the docs read them next to the JSON Schema keywords. */
export type OptionMeta = {
  /** The option's TypeScript type as written for users, such as `'inline' | 'root'`. */
  'x-kubb-type'?: string
  /** The default as display text, when it is not a JSON value, such as `unknownType` or a function. */
  'x-kubb-default'?: string
  /** Suggested values of an option that accepts any string. */
  'x-kubb-values'?: Array<string>
  /** Shows the option only when every entry matches. Keys are dotted option paths, such as `'enum.type'`. */
  'x-kubb-when'?: Record<string, OptionWhenValue | Array<OptionWhenValue>>
  /** Link to the option's documentation. */
  'x-kubb-docs'?: string
  /** Name of the section the option is listed under. */
  'x-kubb-group'?: string
  /** Position of the option within its section. Lower comes first. */
  'x-kubb-order'?: number
}

/** A JSON Schema (draft 2020-12) of an extension's options, with Kubb's `x-kubb-*` keys on each option. */
export type OptionsDocument = OptionMeta & {
  type?: string | Array<string>
  title?: string
  description?: string
  default?: unknown
  deprecated?: boolean
  examples?: Array<unknown>
  const?: unknown
  enum?: Array<unknown>
  properties?: Record<string, OptionsDocument>
  required?: Array<string>
  additionalProperties?: boolean | OptionsDocument
  items?: OptionsDocument
  prefixItems?: Array<OptionsDocument>
  anyOf?: Array<OptionsDocument>
  oneOf?: Array<OptionsDocument>
  allOf?: Array<OptionsDocument>
  $ref?: string
  $defs?: Record<string, OptionsDocument>
  [keyword: string]: unknown
}

/** `ExtensionMeta` as JSON: `contributes` holds options documents instead of schemas. */
export type ExtensionManifestMeta = Omit<ExtensionMeta, 'contributes'> & {
  contributes?: Record<string, OptionsDocument>
}

/** One extension in a {@link KubbManifest}: what it is, its `meta`, and its options. */
export type ExtensionManifest = {
  kind: ExtensionKind
  /** Name of the package export that holds the factory, such as `'adapterOas'`. */
  export?: string
  meta: ExtensionManifestMeta
  /** The options the factory accepts. `{}` when the extension describes none. */
  options: OptionsDocument
}

/** A person from `package.json#author` or `package.json#contributors`. */
export type ManifestContributor = {
  name: string
  email?: string
  url?: string
}

/**
 * The `dist/kubb.json` file a package ships, built by `kubb extension build`. Studio, the kubb.dev
 * registry and the options reference pages read it.
 */
export type KubbManifest = {
  $schema?: string
  /** npm package name. */
  name: string
  version: string
  repository?: {
    url: string
    directory?: string
  }
  /** URL of the issue tracker. */
  bugs?: string
  contributors?: Array<ManifestContributor>
  engines?: {
    node?: string
  }
  extensions: Array<ExtensionManifest>
}

const optionsDocumentRef = { $ref: '#/$defs/optionsDocument' } as const

/** JSON Schema of {@link KubbManifest}, served at `https://kubb.dev/schemas/kubb.json`. */
export const kubbManifestJsonSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: kubbManifestSchemaUrl,
  title: 'Kubb manifest',
  description: 'The dist/kubb.json file of a package with Kubb plugins, adapters or parsers. Built by `kubb extension build`.',
  type: 'object',
  required: ['name', 'version', 'extensions'],
  additionalProperties: false,
  properties: {
    $schema: { type: 'string', description: 'Reference to this schema for editor validation.' },
    name: { type: 'string', minLength: 1, description: 'npm package name.' },
    version: { type: 'string', minLength: 1, description: 'Package version.' },
    repository: {
      type: 'object',
      description: 'Source repository.',
      required: ['url'],
      additionalProperties: false,
      properties: {
        url: { type: 'string', description: 'Repository URL.' },
        directory: { type: 'string', description: 'Package folder inside the repository.' },
      },
    },
    bugs: { type: 'string', description: 'URL of the issue tracker.' },
    contributors: {
      type: 'array',
      description: 'Package author and contributors.',
      items: {
        type: 'object',
        required: ['name'],
        additionalProperties: false,
        properties: {
          name: { type: 'string' },
          email: { type: 'string' },
          url: { type: 'string' },
        },
      },
    },
    engines: {
      type: 'object',
      additionalProperties: false,
      properties: {
        node: { type: 'string', description: 'Supported Node.js range.' },
      },
    },
    extensions: {
      type: 'array',
      description: 'The plugins, adapters and parsers the package exports.',
      items: { $ref: '#/$defs/extension' },
    },
  },
  $defs: {
    extension: {
      type: 'object',
      required: ['kind', 'meta', 'options'],
      additionalProperties: false,
      properties: {
        kind: { enum: ['plugin', 'adapter', 'parser'], description: 'What the extension extends.' },
        export: { type: 'string', description: 'Name of the package export that holds the factory.' },
        meta: { $ref: '#/$defs/meta' },
        options: { ...optionsDocumentRef, description: 'JSON Schema of the options the factory accepts.' },
      },
    },
    meta: {
      type: 'object',
      required: ['name'],
      additionalProperties: false,
      properties: {
        name: { type: 'string', minLength: 1, description: "Unique name, such as 'plugin-ts'." },
        version: { type: 'string' },
        displayName: { type: 'string' },
        description: { type: 'string' },
        category: { type: 'string' },
        icon: {
          type: 'object',
          required: ['light'],
          additionalProperties: false,
          properties: {
            light: { type: 'string' },
            dark: { type: 'string' },
          },
        },
        tags: { type: 'array', items: { type: 'string' } },
        compatibility: {
          type: 'object',
          additionalProperties: false,
          properties: {
            kubb: { type: 'string', description: 'Supported Kubb range.' },
            node: { type: 'string', description: 'Supported Node.js range.' },
          },
        },
        docs: { type: 'string' },
        contributes: {
          type: 'object',
          description: 'Options this extension adds to every plugin, keyed by the option they extend.',
          additionalProperties: optionsDocumentRef,
        },
      },
    },
    optionsDocument: {
      type: 'object',
      description: 'A JSON Schema (draft 2020-12) with Kubb x-kubb-* keys.',
      properties: {
        description: { type: 'string' },
        deprecated: { type: 'boolean' },
        examples: { type: 'array' },
        required: { type: 'array', items: { type: 'string' } },
        properties: { type: 'object', additionalProperties: optionsDocumentRef },
        additionalProperties: { anyOf: [{ type: 'boolean' }, optionsDocumentRef] },
        items: optionsDocumentRef,
        prefixItems: { type: 'array', items: optionsDocumentRef },
        anyOf: { type: 'array', items: optionsDocumentRef },
        oneOf: { type: 'array', items: optionsDocumentRef },
        allOf: { type: 'array', items: optionsDocumentRef },
        $defs: { type: 'object', additionalProperties: optionsDocumentRef },
        'x-kubb-type': { type: 'string', description: 'TypeScript type of the option.' },
        'x-kubb-default': { type: 'string', description: 'Default as display text, when it is not a JSON value.' },
        'x-kubb-values': { type: 'array', items: { type: 'string' }, description: 'Suggested values of a free string.' },
        'x-kubb-when': {
          type: 'object',
          description: 'Shows the option only when every dotted option path matches.',
          additionalProperties: {
            anyOf: [{ type: ['string', 'number', 'boolean', 'null'] }, { type: 'array', items: { type: ['string', 'number', 'boolean', 'null'] } }],
          },
        },
        'x-kubb-docs': { type: 'string', description: 'Link to the documentation of the option.' },
        'x-kubb-group': { type: 'string', description: 'Section the option is listed under.' },
        'x-kubb-order': { type: 'number', description: 'Position within the section.' },
      },
    },
  },
} as const

function hasJsonSchema(schema: StandardSchemaV1): schema is StandardSchemaV1 & StandardJSONSchemaV1 {
  return typeof (schema['~standard'] as Partial<StandardJSONSchemaV1.Props>).jsonSchema?.input === 'function'
}

/**
 * Converts an options schema to an options document with its Standard JSON Schema `input` converter.
 * Returns `{}` without a schema, or for a schema library that has no converter.
 */
export function toOptionsDocument(schema: StandardSchemaV1 | undefined): OptionsDocument {
  if (!schema || !hasJsonSchema(schema)) return {}

  // `unrepresentable: 'any'` lets Zod emit `{}` for functions and `RegExp` instead of throwing. Other libraries ignore it.
  const { $schema: _draft, ...document } = schema['~standard'].jsonSchema.input({
    target: 'draft-2020-12',
    libraryOptions: { unrepresentable: 'any' },
  })
  return document as OptionsDocument
}

/** Builds an extension's manifest entry from its `meta` and options schema. */
export function toExtensionManifest({
  kind,
  meta,
  schema,
  exportName,
}: {
  kind: ExtensionKind
  meta: ExtensionMeta
  schema?: StandardSchemaV1
  exportName?: string
}): ExtensionManifest {
  const { contributes, ...rest } = meta
  const manifestMeta: ExtensionManifestMeta = structuredClone(rest)
  if (contributes) {
    manifestMeta.contributes = Object.fromEntries(Object.entries(contributes).map(([key, contributed]) => [key, toOptionsDocument(contributed)]))
  }

  return {
    kind,
    ...(exportName && { export: exportName }),
    meta: manifestMeta,
    options: toOptionsDocument(schema),
  }
}

function isMissing(error: unknown): boolean {
  const code = (error as { code?: unknown } | null)?.code
  return code === 'MODULE_NOT_FOUND' || code === 'ERR_PACKAGE_PATH_NOT_EXPORTED' || code === 'ENOENT'
}

/**
 * Reads the manifest that `package.json#kubb` points to, resolving the package from `cwd`.
 * Returns `undefined` when the package is not installed, sets no `kubb` field, or the file is missing.
 */
export async function readExtensionManifest(packageName: string, { cwd }: { cwd: string }): Promise<KubbManifest | undefined> {
  try {
    const require = createRequire(path.join(cwd, 'package.json'))
    const packageJsonPath = require.resolve(`${packageName}/package.json`)
    const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8')) as { kubb?: unknown }
    if (typeof packageJson.kubb !== 'string') return undefined

    const manifest = JSON.parse(await readFile(path.resolve(path.dirname(packageJsonPath), packageJson.kubb), 'utf8')) as KubbManifest
    return Array.isArray(manifest?.extensions) ? manifest : undefined
  } catch (error) {
    if (isMissing(error)) return undefined
    throw error
  }
}

/** An extension factory such as `pluginTs`, or the extension it returned. */
export type ManifestSource = {
  kind?: ExtensionKind
  name?: string
  meta?: ExtensionMeta
  schema?: StandardSchemaV1
}

function inferKind(extension: ManifestSource): ExtensionKind {
  if (extension.kind) return extension.kind
  if ('print' in extension) return 'parser'
  if ('validate' in extension && 'parse' in extension) return 'adapter'
  return 'plugin'
}

/**
 * Returns the manifest entry of a factory or a built extension. Prefers the one `packageName` ships,
 * else builds one from `meta` and the options schema, else returns `{}` options.
 */
export async function getExtensionManifest(
  extension: ManifestSource,
  { cwd, packageName }: { cwd: string; packageName?: string },
): Promise<ExtensionManifest | undefined> {
  const meta = extension.meta ?? (extension.name ? { name: extension.name } : undefined)
  if (!meta) return undefined

  const kind = inferKind(extension)
  const shipped = packageName ? await readExtensionManifest(packageName, { cwd }) : undefined
  const entry = shipped?.extensions.find((candidate) => candidate.kind === kind && candidate.meta.name === meta.name)

  return entry ?? toExtensionManifest({ kind, meta, schema: extension.schema })
}
