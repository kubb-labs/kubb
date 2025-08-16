import fetch from '@kubb/plugin-client/clients/axios'
import type { ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'

/**
 * @description Creates a pet in the store.This is an arbitrary description with lots of `strange` but likely formatting from the real world.- We like to make lists - And we need to escape: some, type, of `things`
 * @summary Create a pet
 * {@link /pets}
 */
export async function createPetsHandler({ data }: { data: CreatePetsMutationRequest }): Promise<Promise<CallToolResult>> {
  const requestData = data
  const res = await fetch<CreatePetsMutationResponse, ResponseErrorConfig<Error>, CreatePetsMutationRequest>({
    method: 'POST',
    url: `/pets`,
    data: requestData,
  })
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(res.data),
      },
    ],
  }
}
