import fetch from '@kubb/plugin-client/clients/axios'
import type { ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'

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
