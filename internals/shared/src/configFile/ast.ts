import { getErrorMessage } from '@internals/utils'
import { type Comment, type Expression, type Program, parse } from 'yuku-parser'

export type {
  ArrayExpression,
  AssignmentExpression,
  BindingProperty,
  CallExpression,
  Comment,
  Expression,
  ImportDeclaration,
  ObjectExpression,
  ObjectPropertyKind,
  Program,
  RestElement,
  SpreadElement,
  VariableDeclaration,
} from 'yuku-parser'

const diagnosticSeverities = { error: 'error' } as const

/** A parsed file: its statements and every comment in it, or why it could not be parsed. */
type ParsedSource = { program: Program; comments: Array<Comment> } | { reason: string }

/**
 * Parses `source` as a TypeScript module. Never throws: a syntax error, or a native parser that
 * cannot load on this platform, comes back as a `reason`.
 */
export function parseSource(source: string): ParsedSource {
  try {
    // Parentheses are dropped, so `export default (defineConfig({}))` reads as the call itself.
    const { program, comments, diagnostics } = parse(source, { lang: 'ts', sourceType: 'module', preserveParens: false })
    if (diagnostics.some((diagnostic) => diagnostic.severity === diagnosticSeverities.error)) return { reason: 'the config file could not be parsed' }
    return { program, comments }
  } catch (error) {
    return { reason: `the config parser could not load on this platform: ${getErrorMessage(error)}` }
  }
}

/** Parses `source` as one expression, such as a commented-out `pluginTs({ ... })` call. */
export function parseExpression(source: string): Expression | undefined {
  const parsed = parseSource(source)
  if ('reason' in parsed) return undefined
  const [statement] = parsed.program.body
  return parsed.program.body.length === 1 && statement?.type === 'ExpressionStatement' ? statement.expression : undefined
}
