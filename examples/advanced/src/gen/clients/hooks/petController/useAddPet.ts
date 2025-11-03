import type { QueryClient, UseMutationOptions, UseMutationResult } from '@tanstack/react-query'
import { mutationOptions, useMutation } from '@tanstack/react-query'
import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { AddPet405, AddPetMutationRequest, AddPetMutationResponse } from '../../../models/ts/petController/AddPet.ts'
import { addPet } from '../../axios/petService/addPet.ts'

export const addPetMutationKey = () => [{ url: '/pet' }] as const

export type AddPetMutationKey = ReturnType<typeof addPetMutationKey>

export function addPetMutationOptions(config: Partial<RequestConfig<AddPetMutationRequest>> & { client?: typeof fetch } = {}) {
  const mutationKey = addPetMutationKey()
  return mutationOptions<ResponseConfig<AddPetMutationResponse>, ResponseErrorConfig<AddPet405>, { data: AddPetMutationRequest }, typeof mutationKey>({
    mutationKey,
    mutationFn: async ({ data }) => {
      return addPet({ data }, config)
    },
  })
}

/**
 * @description Add a new pet to the store
 * @summary Add a new pet to the store
 * {@link /pet}
 */
export function useAddPet<TContext>(
  options: {
    mutation?: UseMutationOptions<ResponseConfig<AddPetMutationResponse>, ResponseErrorConfig<AddPet405>, { data: AddPetMutationRequest }, TContext> & {
      client?: QueryClient
    }
    client?: Partial<RequestConfig<AddPetMutationRequest>> & { client?: typeof fetch }
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? addPetMutationKey()

  const baseOptions = addPetMutationOptions(config) as UseMutationOptions<
    ResponseConfig<AddPetMutationResponse>,
    ResponseErrorConfig<AddPet405>,
    { data: AddPetMutationRequest },
    TContext
  >

  return useMutation<ResponseConfig<AddPetMutationResponse>, ResponseErrorConfig<AddPet405>, { data: AddPetMutationRequest }, TContext>(
    {
      ...baseOptions,
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  ) as UseMutationResult<ResponseConfig<AddPetMutationResponse>, ResponseErrorConfig<AddPet405>, { data: AddPetMutationRequest }, TContext>
}
