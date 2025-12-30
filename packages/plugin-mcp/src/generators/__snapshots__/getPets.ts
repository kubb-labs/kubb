import type { ResponseErrorConfig } from './test/.kubb/fetch'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'
import { fetch } from './test/.kubb/fetch'

/**
 * @description Returns all `pets` from the system \n that the user has access to
 * @summary List all pets
 * {@link /pets}
 */
export async function getPetsHandler({ params }: { params?: GetPets }): Promise<Promise<CallToolResult>> {
  const res = await fetch<GetPets, ResponseErrorConfig<Error>, unknown>({ method: 'GET', url: `/pets`, params })
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(res.data),
      },
    ],
  }
}
