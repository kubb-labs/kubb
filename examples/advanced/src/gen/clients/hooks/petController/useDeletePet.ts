import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type { DeletePetResponseData9, DeletePetPathParams9, DeletePetHeaderParams9, DeletePetStatus4009 } from '../../../models/ts/petController/DeletePet.ts'
import type { UseMutationOptions, UseMutationResult, QueryClient } from '@tanstack/react-query'
import { deletePet } from '../../axios/petService/deletePet.ts'
import { mutationOptions, useMutation } from '@tanstack/react-query'

export const deletePetMutationKey = () => [{ url: '/pet/:petId:search' }] as const

export type DeletePetMutationKey = ReturnType<typeof deletePetMutationKey>

export function deletePetMutationOptions(config: Partial<RequestConfig> & { client?: typeof fetch } = {}) {
  const mutationKey = deletePetMutationKey()
  return mutationOptions<
    ResponseConfig<DeletePetResponseData9>,
    ResponseErrorConfig<DeletePetStatus4009>,
    { petId: DeletePetPathParams9['petId']; headers?: DeletePetHeaderParams9 },
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
      ResponseConfig<DeletePetResponseData9>,
      ResponseErrorConfig<DeletePetStatus4009>,
      { petId: DeletePetPathParams9['petId']; headers?: DeletePetHeaderParams9 },
      TContext
    > & { client?: QueryClient }
    client?: Partial<RequestConfig> & { client?: typeof fetch }
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? deletePetMutationKey()

  const baseOptions = deletePetMutationOptions(config) as UseMutationOptions<
    ResponseConfig<DeletePetResponseData9>,
    ResponseErrorConfig<DeletePetStatus4009>,
    { petId: DeletePetPathParams9['petId']; headers?: DeletePetHeaderParams9 },
    TContext
  >

  return useMutation<
    ResponseConfig<DeletePetResponseData9>,
    ResponseErrorConfig<DeletePetStatus4009>,
    { petId: DeletePetPathParams9['petId']; headers?: DeletePetHeaderParams9 },
    TContext
  >(
    {
      ...baseOptions,
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  ) as UseMutationResult<
    ResponseConfig<DeletePetResponseData9>,
    ResponseErrorConfig<DeletePetStatus4009>,
    { petId: DeletePetPathParams9['petId']; headers?: DeletePetHeaderParams9 },
    TContext
  >
}
