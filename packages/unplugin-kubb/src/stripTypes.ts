import { generate } from 'yuku-codegen'
import { type Expression, type ObjectProperty, type TSEnumDeclaration, type VariableDeclaration, parse } from 'yuku-parser'

/**
 * Node types this module reads from the yuku AST.
 */
const nodeTypes = {
  literal: 'Literal',
  unaryExpression: 'UnaryExpression',
  identifier: 'Identifier',
  property: 'Property',
  variableDeclaration: 'VariableDeclaration',
  variableDeclarator: 'VariableDeclarator',
  objectExpression: 'ObjectExpression',
  tsEnumDeclaration: 'TSEnumDeclaration',
  exportNamedDeclaration: 'ExportNamedDeclaration',
} as const

/**
 * Reads a member value written as a number or a negative number, the only values whose name TypeScript also maps back.
 */
function numberOf(value: Expression): number | undefined {
  if (value.type === nodeTypes.literal && typeof value.value === 'number') return value.value
  if (
    value.type === nodeTypes.unaryExpression &&
    value.operator === '-' &&
    value.argument.type === nodeTypes.literal &&
    typeof value.argument.value === 'number'
  ) {
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
    type: nodeTypes.property,
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
    const value = member.initializer ?? { ...span, type: nodeTypes.literal, value: next, raw: String(next) }
    const number = numberOf(value)
    next = number === undefined ? Number.NaN : number + 1
    properties.push(property(member.id, value))
    if (number !== undefined) {
      const name = member.id.type === nodeTypes.identifier ? member.id.name : String(member.id.type === nodeTypes.literal ? member.id.value : '')
      properties.push(
        property(
          { ...span, type: nodeTypes.literal, value: String(number), raw: JSON.stringify(String(number)) },
          { ...span, type: nodeTypes.literal, value: name, raw: JSON.stringify(name) },
        ),
      )
    }
  }

  return {
    ...span,
    type: nodeTypes.variableDeclaration,
    kind: 'const',
    declare: false,
    declarations: [
      { ...span, type: nodeTypes.variableDeclarator, id: declaration.id, init: { ...span, type: nodeTypes.objectExpression, properties }, definite: false },
    ],
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
    if (statement.type === nodeTypes.tsEnumDeclaration && !statement.declare) return enumToObject(statement)
    if (statement.type === nodeTypes.exportNamedDeclaration && statement.declaration?.type === nodeTypes.tsEnumDeclaration && !statement.declaration.declare) {
      return { ...statement, declaration: enumToObject(statement.declaration) }
    }
    return statement
  })

  return generate(program, { strip: true }).code
}
