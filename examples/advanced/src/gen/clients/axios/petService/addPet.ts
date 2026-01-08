import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import fetch from '../../../../axios-client.ts'
import type { AddPetRequestData, AddPetResponseData, AddPetStatus405 } from '../../../models/ts/petController/AddPet.ts'
import { addPetRequestDataSchema, addPetResponseDataSchema } from '../../../zod/petController/addPetSchema.ts'

export function getAddPetUrl() {
  const res = { method: 'POST', url: 'https://petstore3.swagger.io/api/v3/pet' as const }
  return res
}

/**
 * @description Add a new pet to the store
 * @summary Add a new pet to the store
 * {@link /pet}
 */
export async function addPet({ data }: { data: AddPetRequestData }, config: Partial<RequestConfig<AddPetRequestData>> & { client?: typeof fetch } = {}) {
  const { client: request = fetch, ...requestConfig } = config

  const requestData = addPetRequestDataSchema.parse(data)

  const res = await request<AddPetResponseData, ResponseErrorConfig<AddPetStatus405>, AddPetRequestData>({
    method: 'POST',
    url: getAddPetUrl().url.toString(),
    data: requestData,
    ...requestConfig,
  })
  return { ...res, data: addPetResponseDataSchema.parse(res.data) }
}
