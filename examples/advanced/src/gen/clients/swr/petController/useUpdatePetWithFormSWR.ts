import type fetch from '../../../../axios-client.ts'
import useSWRMutation from 'swr/mutation'
import type { RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type {
  UpdatePetWithFormResponseData3,
  UpdatePetWithFormPathParams3,
  UpdatePetWithFormQueryParams3,
  UpdatePetWithFormStatus4053,
} from '../../../models/ts/petController/UpdatePetWithForm.ts'
import type { SWRMutationConfiguration } from 'swr/mutation'
import { updatePetWithForm } from '../../axios/petService/updatePetWithForm.ts'

export const updatePetWithFormMutationKeySWR = () => [{ url: '/pet/:petId:search' }] as const

export type UpdatePetWithFormMutationKeySWR = ReturnType<typeof updatePetWithFormMutationKeySWR>

/**
 * @summary Updates a pet in the store with form data
 * {@link /pet/:petId:search}
 */
export function useUpdatePetWithFormSWR(
  { petId }: { petId: UpdatePetWithFormPathParams3['petId'] },
  params?: UpdatePetWithFormQueryParams3,
  options: {
    mutation?: SWRMutationConfiguration<
      ResponseConfig<UpdatePetWithFormResponseData3>,
      ResponseErrorConfig<UpdatePetWithFormStatus4053>,
      UpdatePetWithFormMutationKeySWR | null,
      never
    > & { throwOnError?: boolean }
    client?: Partial<RequestConfig> & { client?: typeof fetch }
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const mutationKey = updatePetWithFormMutationKeySWR()

  return useSWRMutation<
    ResponseConfig<UpdatePetWithFormResponseData3>,
    ResponseErrorConfig<UpdatePetWithFormStatus4053>,
    UpdatePetWithFormMutationKeySWR | null
  >(
    shouldFetch ? mutationKey : null,
    async (_url) => {
      return updatePetWithForm({ petId, params }, config)
    },
    mutationOptions,
  )
}
