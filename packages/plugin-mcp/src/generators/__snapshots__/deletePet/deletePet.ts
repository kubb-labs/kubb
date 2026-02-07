import type { ResponseErrorConfig } from './test/.kubb/fetch'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'
import { fetch } from './test/.kubb/fetch'

/**
 * {@link /pets/:petId}
 */
export async function deletePetsPetidHandler(): Promise<Promise<CallToolResult>> {
  const res = await fetch<DeletePetsPetidMutationResponse, ResponseErrorConfig<Error>, unknown>({ method: 'DELETE', url: `/pets/${petId}` })
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(res.data),
      },
    ],
  }
}
