import client from '../../../../axios-client.ts'
import type { ResponseConfig } from '../../../../axios-client.ts'
import type { GetPetByIdPathParams, GetPetByIdQueryResponse } from '../../../models/ts/petController/GetPetById'

/**
 * @description Returns a single pet
 * @summary Find pet by ID
 * @link /pet/:petId
 */
export async function getPetById<TData = GetPetByIdQueryResponse>(
  { petId }: GetPetByIdPathParams,
  options: Partial<Parameters<typeof client>[0]> = {},
): Promise<ResponseConfig<TData>> {
  return client<TData>({
    method: 'get',
    url: `/pet/${petId}`,
    ...options,
  })
}
