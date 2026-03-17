import type { ParameterNode } from './nodes/parameter.ts'

/**
 * Groups an array of ParameterNodes by their `in` location
 * (`path`, `query`, `header`, `cookie`).
 */
export function groupParametersByLocation(parameters: Array<ParameterNode>): Record<string, Array<ParameterNode>> {
  const groups: Record<string, Array<ParameterNode>> = {}

  for (const param of parameters) {
    const location = param.in
    if (!groups[location]) {
      groups[location] = []
    }
    groups[location].push(param)
  }

  return groups
}
