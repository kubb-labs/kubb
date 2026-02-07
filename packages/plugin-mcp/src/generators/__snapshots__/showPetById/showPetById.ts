import type { ResponseErrorConfig } from './test/.kubb/fetch'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'
import { fetch } from './test/.kubb/fetch'

/**
 * @summary Info for a specific pet
 * {@link /pets/:petId}
 */
export async function showPetByIdHandler({
  petId,
  testId,
}: {
  petId: ShowPetByIdPathParams['petId']
  testId: ShowPetByIdPathParams['testId']
}): Promise<Promise<CallToolResult>> {
  const res = await fetch<ShowPetByIdQueryResponse, ResponseErrorConfig<Error>, unknown>({ method: 'GET', url: `/pets/${petId}` })
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(res.data),
      },
    ],
  }
}
