import transformers from '@kubb/core/transformers'
import type { Operation } from '@kubb/oas'
import { Const, File } from '@kubb/react-fabric'
import type { KubbNode } from '@kubb/react-fabric/types'

type OperationData = {
  operation: Operation
  contractName: string
}

type Props = {
  name: string
  operations: Array<OperationData>
}

function getOperationKey(operation: Operation): string {
  // Use operationId as the key for predictable and readable output
  return transformers.camelCase(operation.getOperationId())
}

function getGroupKey(operation: Operation): string {
  // Use the first tag as the group key
  const tags = operation.getTags()
  if (tags.length > 0 && tags[0]) {
    return transformers.camelCase(tags[0].name)
  }

  // Fallback: use the first path segment
  const pathSegments = operation.path.split('/').filter(Boolean)
  if (pathSegments.length > 0 && pathSegments[0]) {
    // Remove path parameters like {petId}
    const segment = pathSegments[0].replace(/\{[^}]+\}/g, '')
    if (segment) {
      return transformers.camelCase(segment)
    }
  }

  return 'default'
}

export function Router({ name, operations }: Props): KubbNode {
  // Group operations by tag
  const groups = new Map<string, Map<string, string>>()

  for (const { operation, contractName } of operations) {
    const groupKey = getGroupKey(operation)
    const operationKey = getOperationKey(operation)

    if (!groups.has(groupKey)) {
      groups.set(groupKey, new Map())
    }

    const group = groups.get(groupKey)!
    group.set(operationKey, contractName)
  }

  // Build the router object
  const routerParts: string[] = []

  for (const [groupKey, group] of groups) {
    if (group.size === 1) {
      // Single operation in group - flatten it
      const entry = [...group.entries()][0]
      if (entry) {
        const [_opKey, contractName] = entry
        routerParts.push(`${groupKey}: ${contractName}`)
      }
    } else {
      // Multiple operations - create nested object
      const nestedParts = [...group.entries()].map(([opKey, contractName]) => `    ${opKey}: ${contractName}`)
      routerParts.push(`${groupKey}: {\n${nestedParts.join(',\n')}\n  }`)
    }
  }

  const routerCode = `{\n  ${routerParts.join(',\n  ')}\n}`

  return (
    <File.Source name={name} isExportable isIndexable>
      <Const export name={name}>
        {routerCode}
      </Const>
    </File.Source>
  )
}
