import client from '../../../../axios-client.ts'
import type { ResponseConfig } from '../../../../axios-client.ts'
import type { UpdatePetWithFormMutation } from '../../../models/ts/petController/UpdatePetWithForm'

/**
 * @summary Updates a pet in the store with form data
 * @link /pet/:petId */
export async function updatePetWithForm(
  { petId }: UpdatePetWithFormMutation.PathParams,
  params?: UpdatePetWithFormMutation.QueryParams,
  options: Partial<Parameters<typeof client>[0]> = {},
): Promise<ResponseConfig<UpdatePetWithFormMutation.Response>> {
  const res = await client<UpdatePetWithFormMutation.Response>({
    method: 'post',
    url: `/pet/${petId}`,
    params,
    ...options,
  })
  return res
}
