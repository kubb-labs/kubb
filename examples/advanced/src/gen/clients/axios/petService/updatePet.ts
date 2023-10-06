import client from '../../../client'
import type { ResponseConfig } from '../../../client'
import type { UpdatePetMutationRequest, UpdatePetMutationResponse } from '../../../models/ts/petController/UpdatePet'

/**
 * @description Update an existing pet by Id
 * @summary Update an existing pet
 * @link /pet
 */

export async function updatePet<TData = UpdatePetMutationResponse, TVariables = UpdatePetMutationRequest>(
  data: TVariables,
  options: Partial<Parameters<typeof client>[0]> = {},
): Promise<ResponseConfig<TData>['data']> {
  const { data: resData } = await client<TData, TVariables>({
    method: 'put',
    url: `/pet`,

    data,

    ...options,
  })

  return resData
}
