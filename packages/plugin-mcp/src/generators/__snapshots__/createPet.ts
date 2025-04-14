import client from '@kubb/plugin-client/clients/axios'
import type { ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'

/**
 * @summary Create a pet
 * {@link /pets}
 */
export async function createPetsHandler({ data }: { data: CreatePetsMutationRequest }): Promise<Promise<CallToolResult>> {
  const res = await client<CreatePetsMutationResponse, ResponseErrorConfig<Error>, CreatePetsMutationRequest>({ method: 'POST', url: `/pets`, data })
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(res.data),
      },
    ],
  }
}
