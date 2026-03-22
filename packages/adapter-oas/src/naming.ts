import { getUniqueName, pascalCase } from '@internals/utils'
import { narrowSchema } from '@kubb/ast'
import type { SchemaNode } from '@kubb/ast/types'

/**
 * Configuration for the naming helpers.
 * Encapsulates the mutable state and mode flag that naming functions depend on.
 */
export type NamingConfig = {
  isLegacyNaming: boolean
  usedEnumNames: Record<string, number>
}

/**
 * Builds the propagation name for a child property during recursive schema conversion.
 *
 * - **Legacy naming** (`isLegacyNaming`): parent + property key are combined
 *   (e.g. `ArticleAgeGroups` when parent is `Article` and prop is `ageGroups`).
 * - **Default naming**: same behavior when parent is present; `undefined` otherwise
 *   so the child remains anonymous.
 */
export function resolveChildName({
  config,
  parentName,
  propName,
}: {
  config: NamingConfig
  parentName: string | undefined
  propName: string
}): string | undefined {
  if (config.isLegacyNaming) {
    return parentName ? pascalCase([parentName, propName].join(' ')) : pascalCase(propName)
  }
  return parentName ? pascalCase([parentName, propName].join(' ')) : undefined
}

/**
 * Derives the final name for an enum property schema node.
 *
 * The raw name always includes the enum suffix (e.g. `StatusEnum`).
 * In legacy mode an additional deduplication step appends a numeric suffix
 * when the same name has already been used (e.g. `ParamsStatusEnum2`).
 */
export function resolveEnumPropName({
  config,
  parentName,
  propName,
  enumSuffix,
}: {
  config: NamingConfig
  parentName: string | undefined
  propName: string
  enumSuffix: string
}): string {
  const raw = pascalCase([parentName, propName, enumSuffix].filter(Boolean).join(' '))
  return config.isLegacyNaming ? getUniqueName(raw, config.usedEnumNames) : raw
}

/**
 * Given a freshly-converted property schema, returns the node with a correct
 * `name` attached — or stripped — depending on whether the node is a named
 * enum, a boolean const-enum (always inlined), or a regular schema.
 */
export function applyEnumName({
  config,
  propNode,
  parentName,
  propName,
  enumSuffix,
}: {
  config: NamingConfig
  propNode: SchemaNode
  parentName: string | undefined
  propName: string
  enumSuffix: string
}): SchemaNode {
  const enumNode = narrowSchema(propNode, 'enum')

  // Boolean-primitive enum nodes (e.g. `const: false`) are always inlined as
  // literal types and must not receive a named identifier.
  if (enumNode?.primitive === 'boolean') {
    return { ...propNode, name: undefined }
  }

  if (enumNode) {
    return { ...propNode, name: resolveEnumPropName({ config, parentName, propName, enumSuffix }) }
  }

  return propNode
}
