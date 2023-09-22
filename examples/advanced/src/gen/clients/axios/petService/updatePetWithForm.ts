import client from '../../../client'
import type {
  UpdatePetWithFormMutationResponse,
  UpdatePetWithFormPathParams,
  UpdatepetwithformQueryparams,
} from '../../../models/ts/petController/UpdatePetWithForm'

/**
 * @summary Updates a pet in the store with form data
 * @link /pet/:petId
 */

export function updatePetWithForm<TData = UpdatePetWithFormMutationResponse>(
  petId: UpdatePetWithFormPathParams['petId'],
  params?: UpdatepetwithformQueryparams,
  options: Partial<Parameters<typeof client>[0]> = {},
): Promise<TData> {
  return client<TData>({
    method: 'post',
    url: `/pet/${petId}`,
    params,

    ...options,
  })
}
