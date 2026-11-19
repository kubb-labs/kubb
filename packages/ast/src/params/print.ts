import type { FunctionParameterNode, FunctionParametersNode, ObjectBindingPatternNode, TypeExpression } from '../nodes/params.ts'
import { isIndexedAccessType, isTypeLiteral } from '../nodes/params.ts'

const PARAM_RANK = { required: 0, optional: 1, withDefault: 2, rest: 3 } as const

/** `declaration` prints `id: string, config: Config = {}`, `call` prints `id, config`. */
export type PrintMode = 'declaration' | 'call'

/** Prints a {@link TypeExpression} as TypeScript, such as `GetPetPathParams['petId']` or `{ id: string }`. */
export function renderType(type: TypeExpression): string {
  if (typeof type === 'string') return type
  if (isIndexedAccessType(type)) return `${type.target}['${type.key}']`

  return renderMembers(type.members.map((member) => ({ key: member.name, type: renderType(member.type), optional: member.optional })))
}

// Quotes a key that is not an identifier, so `{ "content-type": string }` stays valid.
function renderKey(name: string): string {
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name) ? name : JSON.stringify(name)
}

function renderMembers(members: Array<{ key: string; type: string; optional?: boolean }>): string {
  return `{ ${members.map((member) => `${renderKey(member.key)}${member.optional ? '?' : ''}: ${member.type}`).join('; ')} }`
}

function groupMembers(param: FunctionParameterNode): ReadonlyArray<{ name: string; optional?: boolean }> | null {
  if (typeof param.name === 'string' || !param.type || !isTypeLiteral(param.type)) return null
  return param.type.members
}

function rank(param: FunctionParameterNode): number {
  if (param.rest) return PARAM_RANK.rest
  if (param.default) return PARAM_RANK.withDefault
  const members = groupMembers(param)
  if (members) return members.every((m) => m.optional) ? PARAM_RANK.optional : PARAM_RANK.required
  return param.optional ? PARAM_RANK.optional : PARAM_RANK.required
}

type GroupMember = { name: string; propertyName?: string; type?: TypeExpression; optional?: boolean }

// Sorts a group's bindings and type members together, required first.
function sortedGroupMembers(name: ObjectBindingPatternNode, type: TypeExpression | undefined): Array<GroupMember> {
  const members = type && isTypeLiteral(type) ? type.members : []
  const memberRank = (optional?: boolean) => (optional ? PARAM_RANK.optional : PARAM_RANK.required)
  return name.elements
    .map((element, index) => ({
      name: element.name,
      propertyName: element.propertyName,
      type: members[index]?.type,
      optional: members[index]?.optional,
    }))
    .toSorted((a, b) => memberRank(a.optional) - memberRank(b.optional))
}

function renderBindingMember(member: GroupMember): string {
  return member.propertyName ? `${member.propertyName}: ${member.name}` : member.name
}

// An inline type is printed from the sorted members, so its keys match the binding order.
function renderGroupType(type: TypeExpression | undefined, sorted: Array<GroupMember>): string | undefined {
  if (!type) return undefined
  if (!isTypeLiteral(type)) return renderType(type)

  const typed = sorted.filter((member) => member.type !== undefined)
  if (!typed.length) return undefined
  return renderMembers(typed.map((member) => ({ key: member.propertyName ?? member.name, type: renderType(member.type!), optional: member.optional })))
}

function printParameter(node: FunctionParameterNode, mode: PrintMode): string {
  const bindingName = node.name

  if (mode === 'call') {
    if (typeof bindingName !== 'string') {
      const keys = sortedGroupMembers(bindingName, node.type).map(renderBindingMember).join(', ')
      return `{ ${keys} }`
    }
    return node.rest ? `...${bindingName}` : bindingName
  }

  if (typeof bindingName !== 'string') {
    const sorted = sortedGroupMembers(bindingName, node.type)
    const binding = `{ ${sorted.map(renderBindingMember).join(', ')} }`
    const allOptional = sorted.every((member) => member.optional)
    const type = renderGroupType(node.type, sorted)
    if (type) {
      if (allOptional) return `${binding}: ${type} = ${node.default ?? '{}'}`
      return node.default ? `${binding}: ${type} = ${node.default}` : `${binding}: ${type}`
    }
    return node.default ? `${binding} = ${node.default}` : binding
  }

  const type = node.type ? renderType(node.type) : undefined

  if (node.rest) {
    return type ? `...${bindingName}: ${type}` : `...${bindingName}`
  }
  if (type) {
    // A default already makes the parameter optional, and `name?: T = x` is invalid.
    if (node.default) return `${bindingName}: ${type} = ${node.default}`
    return node.optional ? `${bindingName}?: ${type}` : `${bindingName}: ${type}`
  }
  return node.default ? `${bindingName} = ${node.default}` : bindingName
}

/**
 * Prints a parameter list, sorted required, optional, defaulted, then rest.
 *
 * @example
 * ```ts
 * ast.params.print(params, 'declaration') // "petId: string, config: Config = {}"
 * ast.params.print(params, 'call') // "petId, config"
 * ```
 */
export function print(node: FunctionParametersNode, mode: PrintMode): string {
  // `toSorted` is a stable sort, so equal-rank params keep their declared order.
  return node.params
    .toSorted((a, b) => rank(a) - rank(b))
    .map((param) => printParameter(param, mode))
    .filter(Boolean)
    .join(', ')
}
