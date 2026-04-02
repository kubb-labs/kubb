import type { ResponseErrorConfig } from './.kubb/fetch'
import type { ShowPetByIdPathPetId, ShowPetByIdResponse } from './ShowPetById'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'
import { fetch } from './.kubb/fetch'

/**
 * {@link /pets/:petId}
 */
export async function showPetByIdHandler({ petId }: { petId: ShowPetByIdPathPetId }): Promise<Promise<CallToolResult>> {
  const res = await fetch<ShowPetByIdResponse, ResponseErrorConfig<Error>, unknown>({ method: 'GET', url: `/pets/${petId}` })
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
