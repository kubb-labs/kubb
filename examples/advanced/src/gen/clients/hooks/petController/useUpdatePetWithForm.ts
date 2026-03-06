import type { QueryClient, UseMutationOptions, UseMutationResult } from '@tanstack/react-query'
import { mutationOptions, useMutation } from '@tanstack/react-query'
import type { Client, RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  UpdatePetWithForm405,
  UpdatePetWithFormMutationResponse,
  UpdatePetWithFormPathParams,
  UpdatePetWithFormQueryParams,
} from '../../../models/ts/petController/UpdatePetWithForm.ts'
import { updatePetWithForm } from '../../axios/petService/updatePetWithForm.ts'

export const updatePetWithFormMutationKey = () => [{ url: '/pet/:petId:search' }] as const

export type UpdatePetWithFormMutationKey = ReturnType<typeof updatePetWithFormMutationKey>

export function updatePetWithFormMutationOptions<TContext = unknown>(config: Partial<RequestConfig> & { client?: Client } = {}) {
  const mutationKey = updatePetWithFormMutationKey()
  return mutationOptions<
    ResponseConfig<UpdatePetWithFormMutationResponse>,
    ResponseErrorConfig<UpdatePetWithForm405>,
    { petId: UpdatePetWithFormPathParams['petId']; params?: UpdatePetWithFormQueryParams },
    TContext
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
      ResponseConfig<UpdatePetWithFormMutationResponse>,
      ResponseErrorConfig<UpdatePetWithForm405>,
      { petId: UpdatePetWithFormPathParams['petId']; params?: UpdatePetWithFormQueryParams },
      TContext
    > & { client?: QueryClient }
    client?: Partial<RequestConfig> & { client?: Client }
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? updatePetWithFormMutationKey()

  const baseOptions = updatePetWithFormMutationOptions(config) as UseMutationOptions<
    ResponseConfig<UpdatePetWithFormMutationResponse>,
    ResponseErrorConfig<UpdatePetWithForm405>,
    { petId: UpdatePetWithFormPathParams['petId']; params?: UpdatePetWithFormQueryParams },
    TContext
  >

  return useMutation<
    ResponseConfig<UpdatePetWithFormMutationResponse>,
    ResponseErrorConfig<UpdatePetWithForm405>,
    { petId: UpdatePetWithFormPathParams['petId']; params?: UpdatePetWithFormQueryParams },
    TContext
  >(
    {
      ...baseOptions,
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  ) as UseMutationResult<
    ResponseConfig<UpdatePetWithFormMutationResponse>,
    ResponseErrorConfig<UpdatePetWithForm405>,
    { petId: UpdatePetWithFormPathParams['petId']; params?: UpdatePetWithFormQueryParams },
    TContext
  >
}
