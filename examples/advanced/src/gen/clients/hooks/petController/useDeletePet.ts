import type { QueryClient, UseMutationOptions, UseMutationResult } from '@tanstack/react-query'
import { mutationOptions, useMutation } from '@tanstack/react-query'
import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { DeletePet400, DeletePetHeaderParams, DeletePetMutationResponse, DeletePetPathParams } from '../../../models/ts/petController/DeletePet.ts'
import { deletePet } from '../../axios/petService/deletePet.ts'

export const deletePetMutationKey = () => [{ url: '/pet/:petId:search' }] as const

export type DeletePetMutationKey = ReturnType<typeof deletePetMutationKey>

export function deletePetMutationOptions(config: Partial<RequestConfig> & { client?: typeof fetch } = {}) {
  const mutationKey = deletePetMutationKey()
  return mutationOptions<
    ResponseConfig<DeletePetMutationResponse>,
    ResponseErrorConfig<DeletePet400>,
    { petId: DeletePetPathParams['petId']; headers?: DeletePetHeaderParams },
    typeof mutationKey
  >({
    mutationKey,
    mutationFn: async ({ petId, headers }) => {
      return deletePet({ petId, headers }, config)
    },
  })
}

/**
 * @description delete a pet
 * @summary Deletes a pet
 * {@link /pet/:petId:search}
 */
export function useDeletePet<TContext>(
  options: {
    mutation?: UseMutationOptions<
      ResponseConfig<DeletePetMutationResponse>,
      ResponseErrorConfig<DeletePet400>,
      { petId: DeletePetPathParams['petId']; headers?: DeletePetHeaderParams },
      TContext
    > & { client?: QueryClient }
    client?: Partial<RequestConfig> & { client?: typeof fetch }
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? deletePetMutationKey()

  const baseOptions = deletePetMutationOptions(config) as UseMutationOptions<
    ResponseConfig<DeletePetMutationResponse>,
    ResponseErrorConfig<DeletePet400>,
    { petId: DeletePetPathParams['petId']; headers?: DeletePetHeaderParams },
    TContext
  >

  return useMutation<
    ResponseConfig<DeletePetMutationResponse>,
    ResponseErrorConfig<DeletePet400>,
    { petId: DeletePetPathParams['petId']; headers?: DeletePetHeaderParams },
    TContext
  >(
    {
      ...baseOptions,
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  ) as UseMutationResult<
    ResponseConfig<DeletePetMutationResponse>,
    ResponseErrorConfig<DeletePet400>,
    { petId: DeletePetPathParams['petId']; headers?: DeletePetHeaderParams },
    TContext
  >
}
