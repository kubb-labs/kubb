import type { ResponseErrorConfig } from './.kubb/fetch'
import type { DeletePetPathPetId, DeletePetResponse } from './DeletePet'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'
import { fetch } from './.kubb/fetch'

/**
 * {@link /pets/:petId}
 */
export async function deletePetHandler({ petId }: { petId: DeletePetPathPetId }): Promise<Promise<CallToolResult>> {
  const res = await fetch<DeletePetResponse, ResponseErrorConfig<Error>, unknown>({ method: 'DELETE', url: `/pets/${petId}` })

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(res.data),
      },
    ],
    structuredContent: { data: res.data },
  }
}
