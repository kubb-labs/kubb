import client from '../../../../axios-client.ts'
import type { ResponseConfig } from '../../../../axios-client.ts'
import type { GetPetByIdQuery } from '../../../models/ts/petController/GetPetById'

/**
 * @description Returns a single pet
 * @summary Find pet by ID
 * @link /pet/:petId */
export async function getPetById(
  { petId }: GetPetByIdQuery.PathParams,
  options: Partial<Parameters<typeof client>[0]> = {},
): Promise<ResponseConfig<GetPetByIdQuery.Response>> {
  const res = await client<GetPetByIdQuery.Response>({
    method: 'get',
    url: `/pet/${petId}`,
    ...options,
  })
  return res
}
