import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type {
  UpdatePetWithFormResponseData9,
  UpdatePetWithFormPathParams9,
  UpdatePetWithFormQueryParams9,
  UpdatePetWithFormStatus4059,
} from '../../../models/ts/petController/UpdatePetWithForm.ts'
import type { UseMutationOptions, UseMutationResult, QueryClient } from '@tanstack/react-query'
import { updatePetWithForm } from '../../axios/petService/updatePetWithForm.ts'
import { mutationOptions, useMutation } from '@tanstack/react-query'

export const updatePetWithFormMutationKey = () => [{ url: '/pet/:petId:search' }] as const

export type UpdatePetWithFormMutationKey = ReturnType<typeof updatePetWithFormMutationKey>

export function updatePetWithFormMutationOptions(config: Partial<RequestConfig> & { client?: typeof fetch } = {}) {
  const mutationKey = updatePetWithFormMutationKey()
  return mutationOptions<
    ResponseConfig<UpdatePetWithFormResponseData9>,
    ResponseErrorConfig<UpdatePetWithFormStatus4059>,
    { petId: UpdatePetWithFormPathParams9['petId']; params?: UpdatePetWithFormQueryParams9 },
    typeof mutationKey
  >({
    mutationKey,
    mutationFn: async ({ petId, params }) => {
      return updatePetWithForm({ petId, params }, config)
    },
  })
}

/**
 * @summary Updates a pet in the store with form data
 * {@link /pet/:petId:search}
 */
export function useUpdatePetWithForm<TContext>(
  options: {
    mutation?: UseMutationOptions<
      ResponseConfig<UpdatePetWithFormResponseData9>,
      ResponseErrorConfig<UpdatePetWithFormStatus4059>,
      { petId: UpdatePetWithFormPathParams9['petId']; params?: UpdatePetWithFormQueryParams9 },
      TContext
    > & { client?: QueryClient }
    client?: Partial<RequestConfig> & { client?: typeof fetch }
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? updatePetWithFormMutationKey()

  const baseOptions = updatePetWithFormMutationOptions(config) as UseMutationOptions<
    ResponseConfig<UpdatePetWithFormResponseData9>,
    ResponseErrorConfig<UpdatePetWithFormStatus4059>,
    { petId: UpdatePetWithFormPathParams9['petId']; params?: UpdatePetWithFormQueryParams9 },
    TContext
  >

  return useMutation<
    ResponseConfig<UpdatePetWithFormResponseData9>,
    ResponseErrorConfig<UpdatePetWithFormStatus4059>,
    { petId: UpdatePetWithFormPathParams9['petId']; params?: UpdatePetWithFormQueryParams9 },
    TContext
  >(
    {
      ...baseOptions,
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  ) as UseMutationResult<
    ResponseConfig<UpdatePetWithFormResponseData9>,
    ResponseErrorConfig<UpdatePetWithFormStatus4059>,
    { petId: UpdatePetWithFormPathParams9['petId']; params?: UpdatePetWithFormQueryParams9 },
    TContext
  >
}
