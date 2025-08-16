import fetch from '@kubb/plugin-client/clients/axios'
import type { ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'

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
