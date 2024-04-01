import client from '../../../../axios-client.ts'
import type { ResponseConfig } from '../../../../axios-client.ts'
import type { GetPetByIdPathParams, GetPetByIdQueryResponse } from '../../../models/ts/petController/GetPetById'

/**
 * @description Returns a single pet
 * @summary Find pet by ID
 * @link /pet/:petId
 */
export async function getPetById(
  {
    petId,
  }: {
    petId: GetPetByIdPathParams['petId']
  },
  options: Partial<Parameters<typeof client>[0]> = {},
): Promise<ResponseConfig<GetPetByIdQueryResponse>> {
  const res = await client<GetPetByIdQueryResponse>({
    method: 'get',
    url: `/pet/${petId}`,
    ...options,
  })
  return res
}
