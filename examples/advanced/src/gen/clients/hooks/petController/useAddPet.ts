import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { AddPetMutationRequest, AddPetMutationResponse, AddPet405 } from '../../../models/ts/petController/AddPet.ts'
import type { UseMutationOptions, QueryClient } from '@tanstack/react-query'
import { addPet } from '../../axios/petService/addPet.ts'
import { useMutation } from '@tanstack/react-query'

export const addPetMutationKey = () => [{ url: '/pet' }] as const

export type AddPetMutationKey = ReturnType<typeof addPetMutationKey>

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

  return useMutation<ResponseConfig<AddPetMutationResponse>, ResponseErrorConfig<AddPet405>, { data: AddPetMutationRequest }, TContext>(
    {
      mutationFn: async ({ data }) => {
        return addPet({ data }, config)
      },
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  )
}
