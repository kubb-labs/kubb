import type { ResponseErrorConfig } from './test/.kubb/fetch'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'
import { fetch } from './test/.kubb/fetch'

/**
 * @summary Info for a specific pet
 * {@link /pets/:petId}
 */
export async function showPetByIdHandler({ petId, testId }: { petId: ShowPetById['petId']; testId: ShowPetById['testId'] }): Promise<Promise<CallToolResult>> {
  const res = await fetch<ShowPetById, ResponseErrorConfig<Error>, unknown>({ method: 'GET', url: `/pets/${petId}` })
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(res.data),
      },
    ],
  }
}
