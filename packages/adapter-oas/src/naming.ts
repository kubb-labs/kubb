import { pascalCase } from '@internals/utils'
import { narrowSchema } from '@kubb/ast'
import type { SchemaNode } from '@kubb/ast/types'

export function resolveChildName(parentName: string | undefined, propName: string): string | undefined {
  return parentName ? pascalCase([parentName, propName].join(' ')) : undefined
}

export function resolveEnumPropName(parentName: string | undefined, propName: string, enumSuffix: string): string {
  return pascalCase([parentName, propName, enumSuffix].filter(Boolean).join(' '))
}

export function applyEnumName(propNode: SchemaNode, parentName: string | undefined, propName: string, enumSuffix: string): SchemaNode {
  const enumNode = narrowSchema(propNode, 'enum')

  if (enumNode?.primitive === 'boolean') {
    return { ...propNode, name: undefined }
  }

  if (enumNode) {
    return { ...propNode, name: resolveEnumPropName(parentName, propName, enumSuffix) }
  }

  return propNode
}
