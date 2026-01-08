import type { SWRMutationConfiguration } from 'swr/mutation'
import useSWRMutation from 'swr/mutation'
import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  UpdatePetWithFormPathParams,
  UpdatePetWithFormQueryParams,
  UpdatePetWithFormResponseData,
  UpdatePetWithFormStatus405,
} from '../../../models/ts/petController/UpdatePetWithForm.ts'
import { updatePetWithForm } from '../../axios/petService/updatePetWithForm.ts'

export const updatePetWithFormMutationKeySWR = () => [{ url: '/pet/:petId:search' }] as const

export type UpdatePetWithFormMutationKeySWR = ReturnType<typeof updatePetWithFormMutationKeySWR>

/**
 * @summary Updates a pet in the store with form data
 * {@link /pet/:petId:search}
 */
export function useUpdatePetWithFormSWR(
  { petId }: { petId: UpdatePetWithFormPathParams['petId'] },
  params?: UpdatePetWithFormQueryParams,
  options: {
    mutation?: SWRMutationConfiguration<
      ResponseConfig<UpdatePetWithFormResponseData>,
      ResponseErrorConfig<UpdatePetWithFormStatus405>,
      UpdatePetWithFormMutationKeySWR | null,
      never
    > & { throwOnError?: boolean }
    client?: Partial<RequestConfig> & { client?: typeof fetch }
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const mutationKey = updatePetWithFormMutationKeySWR()

  return useSWRMutation<ResponseConfig<UpdatePetWithFormResponseData>, ResponseErrorConfig<UpdatePetWithFormStatus405>, UpdatePetWithFormMutationKeySWR | null>(
    shouldFetch ? mutationKey : null,
    async (_url) => {
      return updatePetWithForm({ petId, params }, config)
    },
    mutationOptions,
  )
}
