import type client from '../../../../axios-client.ts'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  UpdatePetWithFormMutationResponse,
  UpdatePetWithFormPathParams,
  UpdatePetWithFormQueryParams,
  UpdatePetWithForm405,
} from '../../../models/ts/petController/UpdatePetWithForm.ts'
import type { UseMutationOptions } from '@tanstack/react-query'
import { updatePetWithForm } from '../../axios/petService/updatePetWithForm.ts'
import { useMutation } from '@tanstack/react-query'

export const updatePetWithFormMutationKey = () => [{ url: '/pet/{petId}' }] as const

export type UpdatePetWithFormMutationKey = ReturnType<typeof updatePetWithFormMutationKey>

/**
 * @summary Updates a pet in the store with form data
 * {@link /pet/:petId}
 */
export function useUpdatePetWithForm<TContext>(
  options: {
    mutation?: UseMutationOptions<
      ResponseConfig<UpdatePetWithFormMutationResponse>,
      ResponseErrorConfig<UpdatePetWithForm405>,
      { petId: UpdatePetWithFormPathParams['petId']; params?: UpdatePetWithFormQueryParams },
      TContext
    >
    client?: Partial<RequestConfig> & { client?: typeof client }
  } = {},
) {
  const { mutation: mutationOptions, client: config = {} } = options ?? {}
  const mutationKey = mutationOptions?.mutationKey ?? updatePetWithFormMutationKey()

  return useMutation<
    ResponseConfig<UpdatePetWithFormMutationResponse>,
    ResponseErrorConfig<UpdatePetWithForm405>,
    { petId: UpdatePetWithFormPathParams['petId']; params?: UpdatePetWithFormQueryParams },
    TContext
  >({
    mutationFn: async ({ petId, params }) => {
      return updatePetWithForm({ petId, params }, config)
    },
    mutationKey,
    ...mutationOptions,
  })
}
