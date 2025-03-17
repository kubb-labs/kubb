import type client from '../../../../axios-client.ts'
import useSWRMutation from 'swr/mutation'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  UpdatePetWithFormMutationResponse,
  UpdatePetWithFormPathParams,
  UpdatePetWithFormQueryParams,
  UpdatePetWithForm405,
} from '../../../models/ts/petController/UpdatePetWithForm.ts'
import { updatePetWithForm } from '../../axios/petService/updatePetWithForm.ts'

export const updatePetWithFormMutationKeySWR = () => [{ url: '/pet/{petId}' }] as const

export type UpdatePetWithFormMutationKeySWR = ReturnType<typeof updatePetWithFormMutationKeySWR>

/**
 * @summary Updates a pet in the store with form data
 * {@link /pet/:petId}
 */
export function useUpdatePetWithFormSWR(
  { petId }: { petId: UpdatePetWithFormPathParams['petId'] },
  params?: UpdatePetWithFormQueryParams,
  options: {
    mutation?: Parameters<
      typeof useSWRMutation<ResponseConfig<UpdatePetWithFormMutationResponse>, ResponseErrorConfig<UpdatePetWithForm405>, UpdatePetWithFormMutationKeySWR>
    >[2]
    client?: Partial<RequestConfig> & { client?: typeof client }
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const mutationKey = updatePetWithFormMutationKeySWR()

  return useSWRMutation<ResponseConfig<UpdatePetWithFormMutationResponse>, ResponseErrorConfig<UpdatePetWithForm405>, UpdatePetWithFormMutationKeySWR | null>(
    shouldFetch ? mutationKey : null,
    async (_url) => {
      return updatePetWithForm({ petId, params }, config)
    },
    mutationOptions,
  )
}
