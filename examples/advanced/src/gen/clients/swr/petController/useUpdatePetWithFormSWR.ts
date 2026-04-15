import useSWRMutation from 'swr/mutation'
import type { Client, RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type {
  UpdatePetWithFormPathParams,
  UpdatePetWithFormQueryParams,
  UpdatePetWithFormMutationResponse,
  UpdatePetWithForm405,
} from '../../../models/ts/petController/UpdatePetWithForm.ts'
import type { SWRMutationConfiguration } from 'swr/mutation'
import { updatePetWithForm } from '../../axios/petService/updatePetWithForm.ts'

export const updatePetWithFormSWRMutationKey = () => [{ url: '/pet/:petId:search' }] as const

export type UpdatePetWithFormSWRMutationKey = ReturnType<typeof updatePetWithFormSWRMutationKey>

/**
 * @summary Updates a pet in the store with form data
 * {@link /pet/:petId:search}
 */
export function useUpdatePetWithFormSWR(
  { petId }: { petId: UpdatePetWithFormPathParams['petId'] },
  params?: UpdatePetWithFormQueryParams,
  options: {
    mutation?: SWRMutationConfiguration<
      ResponseConfig<UpdatePetWithFormMutationResponse>,
      ResponseErrorConfig<UpdatePetWithForm405>,
      UpdatePetWithFormSWRMutationKey | null,
      never
    > & { throwOnError?: boolean }
    client?: Partial<RequestConfig> & { client?: Client }
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const mutationKey = updatePetWithFormSWRMutationKey()

  return useSWRMutation<ResponseConfig<UpdatePetWithFormMutationResponse>, ResponseErrorConfig<UpdatePetWithForm405>, UpdatePetWithFormSWRMutationKey | null>(
    shouldFetch ? mutationKey : null,
    async (_url) => {
      return updatePetWithForm({ petId, params }, config)
    },
    mutationOptions,
  )
}
