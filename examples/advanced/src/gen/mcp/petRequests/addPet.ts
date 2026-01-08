import type { ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import fetch from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'
import type { AddPetRequestData, AddPetResponseData, AddPetStatus405 } from '../../models/ts/petController/AddPet.ts'

/**
 * @description Add a new pet to the store
 * @summary Add a new pet to the store
 * {@link /pet}
 */
export async function addPetHandler({ data }: { data: AddPetRequestData }): Promise<Promise<CallToolResult>> {
  const requestData = data

  const res = await fetch<AddPetResponseData, ResponseErrorConfig<AddPetStatus405>, AddPetRequestData>({
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
