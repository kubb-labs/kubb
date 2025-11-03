import type { CallToolResult } from '@modelcontextprotocol/sdk/types'
import type { ResponseErrorConfig } from '../../.kubb/fetcher.ts'
import fetch from '../../.kubb/fetcher.ts'
import type { AddPet405, AddPetMutationRequest, AddPetMutationResponse } from '../../models/ts/petController/AddPet.ts'

/**
 * @description Add a new pet to the store
 * @summary Add a new pet to the store
 * {@link /pet}
 */
export async function addPetHandler({ data }: { data: AddPetMutationRequest }): Promise<Promise<CallToolResult>> {
  const requestData = data

  const res = await fetch<AddPetMutationResponse, ResponseErrorConfig<AddPet405>, AddPetMutationRequest>({
    method: 'POST',
    url: '/pet',
    baseURL: 'https://petstore.swagger.io/v2',
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
