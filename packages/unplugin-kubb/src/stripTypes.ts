import { generate } from 'yuku-codegen'
import { type Expression, type ObjectProperty, type TSEnumDeclaration, type VariableDeclaration, parse } from 'yuku-parser'

/**
 * Reads a member value written as a number or a negative number, the only values whose name TypeScript also maps back.
 */
function numberOf(value: Expression): number | undefined {
  if (value.type === 'Literal' && typeof value.value === 'number') return value.value
  if (value.type === 'UnaryExpression' && value.operator === '-' && value.argument.type === 'Literal' && typeof value.argument.value === 'number') {
    return -value.argument.value
  }
  return undefined
}

/**
 * Builds the object TypeScript emits for an enum: each member by name and, for a numeric member, its name by value.
 * The new nodes take the enum's span, as they replace it.
 */
function enumToObject(declaration: TSEnumDeclaration): VariableDeclaration {
  const span = { start: declaration.start, end: declaration.end }
  const property = (key: ObjectProperty['key'], value: Expression): ObjectProperty => ({
    ...span,
    type: 'Property',
    kind: 'init',
    key,
    value,
    computed: false,
    method: false,
    shorthand: false,
  })
  const properties: Array<ObjectProperty> = []
  let next = 0

  for (const member of declaration.body.members) {
    const value = member.initializer ?? { ...span, type: 'Literal' as const, value: next, raw: String(next) }
    const number = numberOf(value)
    next = number === undefined ? Number.NaN : number + 1
    properties.push(property(member.id, value))
    if (number !== undefined) {
      const name = member.id.type === 'Identifier' ? member.id.name : String(member.id.type === 'Literal' ? member.id.value : '')
      properties.push(
        property(
          { ...span, type: 'Literal', value: String(number), raw: JSON.stringify(String(number)) },
          { ...span, type: 'Literal', value: name, raw: JSON.stringify(name) },
        ),
      )
    }
  }

  return {
    ...span,
    type: 'VariableDeclaration',
    kind: 'const',
    declare: false,
    declarations: [{ ...span, type: 'VariableDeclarator', id: declaration.id, init: { ...span, type: 'ObjectExpression', properties }, definite: false }],
  }
}

/**
 * Turns generated TypeScript into JavaScript: types are stripped and enums become plain objects, as `tsc` emits them.
 */
export function stripTypes(source: string, fileName: string): string {
  const { program, diagnostics } = parse(source, { lang: 'ts', sourceType: 'module' })
  const error = diagnostics.find((diagnostic) => diagnostic.severity === 'error')
  if (error) throw new SyntaxError(`${fileName}: ${error.message}`)

  program.body = program.body.map((statement) => {
    if (statement.type === 'TSEnumDeclaration' && !statement.declare) return enumToObject(statement)
    if (statement.type === 'ExportNamedDeclaration' && statement.declaration?.type === 'TSEnumDeclaration' && !statement.declaration.declare) {
      return { ...statement, declaration: enumToObject(statement.declaration) }
    }
    return statement
  })

  return generate(program, { strip: true }).code
}
