import { pascalCase } from '@internals/utils'
import type { OperationNode, ParameterNode } from '@kubb/ast/types'

export type ResolveName = (params: { name: string; type?: 'file' | 'function' | 'type' | 'const' }) => string

/**
 * The default `resolveName` used by plugin-ts.
 * Applies `pascalCase` to the name, matching plugin-ts's own `resolveName` implementation.
 */
export const defaultResolveName: ResolveName = ({ name, type }) => pascalCase(name, { isFile: type === 'file' })

/**
 * Returns the resolved name for a schema node (e.g. `Pet`, `PetList`).
 */
export function getSchemaName(node: { name?: string }, { type = 'type', resolveName = defaultResolveName }: { type?: 'file' | 'function' | 'type'; resolveName?: ResolveName } = {}): string {
  if (!node.name) {
    throw new Error('Schema node does not have a name')
  }

  return resolveName({ name: node.name, type })
}

/**
 * Returns the resolved name for an individual parameter type of an operation.
 *
 * @example
 * // path param `petId` of operation `deletePet` → `DeletePetPathPetId`
 * getParameterName(node, { name: 'petId', in: 'path' })
 */
export function getParameterName(
  node: Pick<OperationNode, 'operationId'>,
  param: Pick<ParameterNode, 'name' | 'in'>,
  { type = 'type', resolveName = defaultResolveName }: { type?: 'function' | 'type'; resolveName?: ResolveName } = {},
): string {
  return resolveName({ name: `${node.operationId} ${pascalCase(param.in)} ${param.name}`, type })
}

/**
 * Returns the resolved name for a specific response status type of an operation.
 *
 * @example
 * // 200 response of operation `deletePet` → `DeletePetStatus200`
 * getResponseStatusName(node, 200)
 */
export function getResponseStatusName(
  node: Pick<OperationNode, 'operationId'>,
  statusCode: number | string,
  { type = 'type', resolveName = defaultResolveName }: { type?: 'function' | 'type'; resolveName?: ResolveName } = {},
): string {
  return resolveName({ name: `${node.operationId} Status ${statusCode}`, type })
}

/**
 * Returns the resolved name for the request body type of an operation.
 *
 * @example
 * // request body of operation `createPet` → `CreatePetData`
 * getRequestBodyName(node)
 */
export function getRequestBodyName(
  node: Pick<OperationNode, 'operationId'>,
  { type = 'type', resolveName = defaultResolveName }: { type?: 'function' | 'type'; resolveName?: ResolveName } = {},
): string {
  return resolveName({ name: `${node.operationId} Data`, type })
}

/**
 * Returns the resolved name for the `RequestConfig` type of an operation.
 *
 * @example
 * // request config of operation `deletePet` → `DeletePetRequestConfig`
 * getRequestConfigName(node)
 */
export function getRequestConfigName(
  node: Pick<OperationNode, 'operationId'>,
  { type = 'type', resolveName = defaultResolveName }: { type?: 'function' | 'type'; resolveName?: ResolveName } = {},
): string {
  return resolveName({ name: `${node.operationId} RequestConfig`, type })
}

/**
 * Returns the resolved name for the `Responses` map type of an operation (status code → response type).
 *
 * @example
 * // responses map of operation `listPets` → `ListPetsResponses`
 * getResponsesName(node)
 */
export function getResponsesName(
  node: Pick<OperationNode, 'operationId'>,
  { type = 'type', resolveName = defaultResolveName }: { type?: 'function' | 'type'; resolveName?: ResolveName } = {},
): string {
  return resolveName({ name: `${node.operationId} Responses`, type })
}

/**
 * Returns the resolved name for the union `Response` type of an operation (union of all response types).
 *
 * @example
 * // response union of operation `listPets` → `ListPetsResponse`
 * getResponseName(node)
 */
export function getResponseName(
  node: Pick<OperationNode, 'operationId'>,
  { type = 'type', resolveName = defaultResolveName }: { type?: 'function' | 'type'; resolveName?: ResolveName } = {},
): string {
  return resolveName({ name: `${node.operationId} Response`, type })
}
