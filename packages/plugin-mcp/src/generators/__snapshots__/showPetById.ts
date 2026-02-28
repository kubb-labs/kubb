import type { ResponseErrorConfig } from './test/.kubb/fetch'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'
import { fetch } from './test/.kubb/fetch'

/**
 * @summary Info for a specific pet
 * {@link /pets/:petId}
 */
export async function showPetByIdHandler(
  { petId, testId }: { petId: ShowPetByIdPathParams['petId']; testId: ShowPetByIdPathParams['testId'] },
  request?: unknown,
): Promise<Promise<CallToolResult>> {
  const res = await fetch<ShowPetByIdQueryResponse, ResponseErrorConfig<Error>, unknown>({ method: 'GET', url: `/pets/${petId}` }, request)
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(res.data),
      },
    ],
  }
}
