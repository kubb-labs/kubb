import client from '../../../../axios-client.ts'

import type { ResponseConfig } from '../../../../axios-client.ts'
import type {
  UpdatePetWithFormMutationResponse,
  UpdatePetWithFormPathParams,
  UpdatePetWithFormQueryParams,
} from '../../../models/ts/petController/UpdatePetWithForm'

/**
 * @summary Updates a pet in the store with form data
 * @link /pet/:petId
 */
export async function updatePetWithForm<TData = UpdatePetWithFormMutationResponse>(
  { petId }: UpdatePetWithFormPathParams,
  params?: UpdatePetWithFormQueryParams,
  options: Partial<Parameters<typeof client>[0]> = {},
): Promise<ResponseConfig<TData>> {
  return client<TData>({
    method: 'post',
    url: `/pet/${petId}`,
    params,
    ...options,
  })
}
