import type { ResponseErrorConfig } from './test/.kubb/fetch'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'
import { fetch } from './test/.kubb/fetch'

/**
 * {@link /pets/:petId}
 */
export async function deletePetsPetidHandler(request?: unknown): Promise<Promise<CallToolResult>> {
  const res = await fetch<DeletePetsPetidMutationResponse, ResponseErrorConfig<Error>, unknown>({ method: 'DELETE', url: `/pets/${petId}` }, request)
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(res.data),
      },
    ],
  }
}
