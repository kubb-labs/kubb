import client from '../../../../axios-client.ts'
import type { ResponseConfig } from '../../../../axios-client.ts'
import type { AddPetMutation } from '../../../models/ts/petController/AddPet'

/**
 * @description Add a new pet to the store
 * @summary Add a new pet to the store
 * @link /pet */
export async function addPet(
  data: AddPetMutation.Request,
  options: Partial<Parameters<typeof client>[0]> = {},
): Promise<ResponseConfig<AddPetMutation.Response>> {
  const res = await client<AddPetMutation.Response, AddPetMutation.Request>({
    method: 'post',
    url: `/pet`,
    data,
    ...options,
  })
  return res
}
