import type { ResponseErrorConfig } from './test/.kubb/fetch'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'
import { fetch } from './test/.kubb/fetch'

/**
 * @description Returns all `pets` from the system \n that the user has access to
 * @summary List all pets
 * {@link /pets}
 */
export async function getPetsTemplateStringHandler({ params }: { params?: GetPetsTemplateString }): Promise<Promise<CallToolResult>> {
  const res = await fetch<GetPetsTemplateString, ResponseErrorConfig<Error>, unknown>({ method: 'GET', url: `/pets`, baseURL: `${123456}`, params })
}
