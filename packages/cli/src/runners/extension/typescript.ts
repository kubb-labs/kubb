import path from 'node:path'
import type { OptionsDocument } from '@kubb/core'
import type * as TS from 'typescript'

/** What the TypeScript declaration of one option adds to its options document node. */
export type OptionAnnotation = {
  /** The JSDoc body. */
  description?: string
  deprecated?: boolean
  /** One entry per `@example` tag. */
  examples?: Array<string>
  /** The first `@see` tag. */
  docs?: string
  /** `checker.typeToString` of the option's type, without `undefined`. */
  type: string
  /** The `@default` tag, as a JSON value when it parses as one, else as text. */
  default?: { value: unknown } | { text: string }
}

/** An export's options as TypeScript sees them: a JSON Schema built from the type, and the annotations of every option. */
export type OptionTypes = {
  document: OptionsDocument
  annotations: Array<{ path: Array<string>; annotation: OptionAnnotation }>
}

type WalkContext = {
  path: Array<string>
  depth: number
  /** Object types on the way down, to stop on recursive types. */
  seen: ReadonlyArray<TS.Type>
  annotations: OptionTypes['annotations']
}

// Deep enough for `output.barrel.type`, shallow enough to stop on recursive types.
const maxDepth = 6

/** Loads the optional `typescript` peer dependency. */
export async function loadTypeScript(): Promise<typeof TS> {
  try {
    const ts = await import('typescript')
    return (ts.default ?? ts) as typeof TS
  } catch {
    throw new Error('`kubb extension build` reads option types with the TypeScript compiler. Install `typescript` as a dev dependency.')
  }
}

function parseDefault(raw: string): OptionAnnotation['default'] {
  const text = raw.trim().replace(/^`(.*)`$/s, '$1')
  // Accepts single-quoted strings, as JSDoc usually writes them.
  for (const candidate of [text, text.replace(/'((?:[^'\\]|\\.)*)'/g, (_match, inner: string) => JSON.stringify(inner))]) {
    try {
      return { value: JSON.parse(candidate) }
    } catch {
      // Not JSON, try the next form.
    }
  }
  return { text }
}

/** Turns `{@link Foo}` into `` `Foo` ``, and `{@link target | label}` or `{@link target label}` into its label. */
function formatLinks(text: string): string {
  return text.replace(/\{@link(?:code|plain)?\s+([^\s|}]+)(?:\s*\|\s*|\s+)?([^}]*)\}/g, (_match, target: string, label: string) => {
    if (label.trim()) return label.trim()
    return /^https?:\/\//.test(target) ? target : `\`${target}\``
  })
}

function readCompilerOptions(ts: typeof TS, cwd: string): TS.CompilerOptions {
  const configPath = ts.findConfigFile(cwd, ts.sys.fileExists)
  if (!configPath) {
    return { strict: true, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler, target: ts.ScriptTarget.ES2022 }
  }

  const { config } = ts.readConfigFile(configPath, ts.sys.readFile)
  return ts.parseJsonConfigFileContent(config, ts.sys, path.dirname(configPath)).options
}

/** Reads the options type of each export in `exportNames` from `entry`: the first parameter of its call signature. */
export function readOptionTypes(
  ts: typeof TS,
  { cwd, entry, exportNames }: { cwd: string; entry: string; exportNames: Array<string> },
): Map<string, OptionTypes> {
  const program = ts.createProgram({ rootNames: [entry], options: { ...readCompilerOptions(ts, cwd), noEmit: true } })
  const checker = program.getTypeChecker()
  const sourceFile = program.getSourceFile(entry)
  if (!sourceFile) throw new Error(`TypeScript cannot read ${entry}. Pass the source entry with --entry.`)

  const moduleSymbol = checker.getSymbolAtLocation(sourceFile)
  const result = new Map<string, OptionTypes>()
  if (!moduleSymbol) return result

  const formatFlags = ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseSingleQuotesForStringLiteralType

  function isLibraryType(type: TS.Type): boolean {
    const declarations = (type.aliasSymbol ?? type.getSymbol())?.getDeclarations() ?? []
    return declarations.some((declaration) => program.isSourceFileDefaultLibrary(declaration.getSourceFile()))
  }

  function isPlainObject(type: TS.Type): boolean {
    if (!(type.flags & (ts.TypeFlags.Object | ts.TypeFlags.Intersection))) return false
    if (type.isIntersection() && type.types.some((member) => member.flags & ts.TypeFlags.StringLike)) return false
    return !checker.isArrayLikeType(type) && type.getCallSignatures().length === 0 && !isLibraryType(type)
  }

  function annotate(symbol: TS.Symbol, type: TS.Type): OptionAnnotation {
    const annotation: OptionAnnotation = { type: checker.typeToString(checker.getNonNullableType(type), undefined, formatFlags) }
    const description = formatLinks(ts.displayPartsToString(symbol.getDocumentationComment(checker)).trim())
    if (description) annotation.description = description

    for (const tag of symbol.getJsDocTags(checker)) {
      const text = ts.displayPartsToString(tag.text).trim()
      if (tag.name === 'deprecated') annotation.deprecated = true
      if (tag.name === 'example' && text) annotation.examples = [...(annotation.examples ?? []), text]
      if (tag.name === 'see' && text && !annotation.docs) annotation.docs = /https?:\/\/[^\s}|]+/.exec(text)?.[0] ?? formatLinks(text)
      if (tag.name === 'default' && text && !annotation.default) annotation.default = parseDefault(text)
    }
    return annotation
  }

  function describeObject(type: TS.Type, members: ReadonlyArray<TS.Type>, context: WalkContext): OptionsDocument {
    if (context.depth >= maxDepth || context.seen.includes(type)) return { type: 'object' }

    // A union of objects reads as one object: its shared properties carry the union of their types.
    const properties = new Map(checker.getPropertiesOfType(type).map((property) => [property.name, property]))
    for (const member of members) {
      for (const property of checker.getPropertiesOfType(member)) {
        if (!properties.has(property.name)) properties.set(property.name, property)
      }
    }

    const document: OptionsDocument = { type: 'object', properties: {} }
    const required: Array<string> = []
    const seen = [...context.seen, type]
    for (const [name, property] of properties) {
      const propertyType = checker.getTypeOfSymbol(property)
      const propertyPath = [...context.path, name]
      context.annotations.push({ path: propertyPath, annotation: annotate(property, propertyType) })
      document.properties![name] = describe(propertyType, { ...context, path: propertyPath, depth: context.depth + 1, seen })

      const inEveryMember = members.length <= 1 || members.every((member) => member.getProperty(name))
      if (!(property.flags & ts.SymbolFlags.Optional) && inEveryMember) required.push(name)
    }
    if (required.length) document.required = required

    const stringIndex = checker.getIndexInfosOfType(type).find((info) => info.keyType.flags & ts.TypeFlags.StringLike)
    if (stringIndex) document.additionalProperties = describe(stringIndex.type, { ...context, depth: context.depth + 1, seen })

    return document
  }

  function describeUnion(type: TS.UnionType, context: WalkContext): OptionsDocument {
    const members = type.types.filter((member) => !(member.flags & (ts.TypeFlags.Undefined | ts.TypeFlags.Void)))
    const hasTrue = members.some((member) => member.flags & ts.TypeFlags.BooleanLiteral && checker.typeToString(member) === 'true')
    const hasFalse = members.some((member) => member.flags & ts.TypeFlags.BooleanLiteral && checker.typeToString(member) === 'false')
    const isBoolean = hasTrue && hasFalse
    const rest = isBoolean ? members.filter((member) => !(member.flags & ts.TypeFlags.BooleanLiteral)) : members

    if (rest.length === 0) return { type: 'boolean' }
    if (rest.length === 1 && !isBoolean) return describe(rest[0]!, context)
    // Without `undefined`, so the merged properties carry every member's type.
    if (rest.every(isPlainObject) && !isBoolean) return describeObject(checker.getNonNullableType(type), rest, context)

    // `string` itself, or `string & {}` from a `LiteralUnion`.
    const isString = (member: TS.Type) => Boolean(member.flags & ts.TypeFlags.String) || (member.isIntersection() && member.types.some(isString))
    const stringLiterals = rest.flatMap((member) => (member.isStringLiteral() ? [member.value] : []))
    const isOpenString = rest.some(isString)
    const others = rest.filter((member) => !member.isStringLiteral() && !isString(member))

    const variants: Array<OptionsDocument> = []
    if (isBoolean) variants.push({ type: 'boolean' })
    if (isOpenString) variants.push(stringLiterals.length ? { type: 'string', 'x-kubb-values': stringLiterals } : { type: 'string' })
    else if (stringLiterals.length)
      variants.push(stringLiterals.length === 1 ? { type: 'string', const: stringLiterals[0] } : { type: 'string', enum: stringLiterals })
    for (const member of others) variants.push(describe(member, context))

    return variants.length === 1 ? variants[0]! : { anyOf: variants }
  }

  function describe(type: TS.Type, context: WalkContext): OptionsDocument {
    const { flags } = type
    if (flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) return {}
    if (type.isStringLiteral()) return { type: 'string', const: type.value }
    if (type.isNumberLiteral()) return { type: 'number', const: type.value }
    if (flags & ts.TypeFlags.Boolean) return { type: 'boolean' }
    if (flags & ts.TypeFlags.BooleanLiteral) return { type: 'boolean', const: checker.typeToString(type) === 'true' }
    if (flags & (ts.TypeFlags.String | ts.TypeFlags.TemplateLiteral)) return { type: 'string' }
    if (flags & ts.TypeFlags.Number) return { type: 'number' }
    if (flags & ts.TypeFlags.Null) return { type: 'null' }
    if (type.isUnion()) return describeUnion(type, context)

    // Array items and record values have no dotted path of their own, so their properties are not annotated.
    const unannotated = { ...context, annotations: [] }
    if (checker.isTupleType(type)) {
      return { type: 'array', prefixItems: checker.getTypeArguments(type as TS.TypeReference).map((item) => describe(item, unannotated)) }
    }
    if (checker.isArrayType(type)) {
      const [item] = checker.getTypeArguments(type as TS.TypeReference)
      return item ? { type: 'array', items: describe(item, unannotated) } : { type: 'array' }
    }
    if (isPlainObject(type)) return describeObject(type, [], context)

    // Functions, class instances such as `RegExp`, and anything JSON Schema cannot describe.
    return {}
  }

  for (const exported of checker.getExportsOfModule(moduleSymbol)) {
    if (!exportNames.includes(exported.name)) continue

    const symbol = exported.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exported) : exported
    const parameter = checker.getTypeOfSymbol(symbol).getCallSignatures()[0]?.getParameters()[0]
    const annotations: OptionTypes['annotations'] = []
    const document = parameter ? describe(checker.getNonNullableType(checker.getTypeOfSymbol(parameter)), { path: [], depth: 0, seen: [], annotations }) : {}

    result.set(exported.name, { document, annotations })
  }

  return result
}
