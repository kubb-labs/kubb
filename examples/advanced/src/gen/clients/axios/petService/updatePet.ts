import client from '../../../../axios-client.ts'
import type { ResponseConfig } from '../../../../axios-client.ts'
import type { UpdatePetMutation } from '../../../models/ts/petController/UpdatePet'

/**
 * @description Update an existing pet by Id
 * @summary Update an existing pet
 * @link /pet */
export async function updatePet(
  data: UpdatePetMutation.Request,
  options: Partial<Parameters<typeof client>[0]> = {},
): Promise<ResponseConfig<UpdatePetMutation.Response>> {
  const res = await client<UpdatePetMutation.Response, UpdatePetMutation.Request>({
    method: 'put',
    url: `/pet`,
    data,
    ...options,
  })
  return res
}
