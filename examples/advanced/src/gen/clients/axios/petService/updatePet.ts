import fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  UpdatePetRequestData,
  UpdatePetResponseData,
  UpdatePetStatus400,
  UpdatePetStatus404,
  UpdatePetStatus405,
} from '../../../models/ts/petController/UpdatePet.ts'
import { updatePetResponseData2Schema, updatePetRequestData2Schema } from '../../../zod/petController/updatePetSchema.ts'

export function getUpdatePetUrl() {
  const res = { method: 'PUT', url: 'https://petstore3.swagger.io/api/v3/pet' as const }
  return res
}

/**
 * @description Update an existing pet by Id
 * @summary Update an existing pet
 * {@link /pet}
 */
export async function updatePet(
  { data }: { data: UpdatePetRequestData },
  config: Partial<RequestConfig<UpdatePetRequestData>> & { client?: typeof fetch } = {},
) {
  const { client: request = fetch, ...requestConfig } = config

  const requestData = updatePetRequestData2Schema.parse(data)

  const res = await request<UpdatePetResponseData, ResponseErrorConfig<UpdatePetStatus400 | UpdatePetStatus404 | UpdatePetStatus405>, UpdatePetRequestData>({
    method: 'PUT',
    url: getUpdatePetUrl().url.toString(),
    data: requestData,
    ...requestConfig,
  })
  return { ...res, data: updatePetResponseData2Schema.parse(res.data) }
}
